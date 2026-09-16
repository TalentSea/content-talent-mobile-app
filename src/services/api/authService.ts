import RNFS from 'react-native-fs';
import { apiRequest, setApiAccessToken, getApiAccessToken, decodeJwtCreatorId } from './client';
import { USE_MOCK_VIDEOS, DEFAULT_AUTH_TOKEN, getCreatorId, registerCreatorIdListener } from '../../constants/config';
import { getOrCreateDeviceId, getDeviceInfo } from '../../utils/deviceIdHelper';

// Automatically purge and re-issue guest JWT session when setCreatorId is called at runtime
registerCreatorIdListener(async (newCreatorId) => {
  console.log(`[authService] Creator ID changed to ${newCreatorId}. Purging old session & requesting fresh guest JWT...`);
  await removeSessionFromStorage();
  setApiAccessToken(null);
  currentAuthenticatedUser = null;
  storedRefreshToken = null;
  try {
    await loginAsGuest(undefined, newCreatorId);
  } catch (e) {
    console.warn('[authService] Error auto-provisioning guest session for new creator:', e);
  }
});

export type SocialProvider = 'google' | 'facebook' | 'guest';

export type UserProfile = {
  id: number;
  name: string;
  email: string | null;
  avatar_url?: string | null;
  provider: 'google' | 'facebook' | 'guest' | string;
  role: 'guest' | 'member' | 'subscriber' | 'premium' | 'admin' | string;
  chosen_plan?: string | null;
  plan_id?: string | null;
  created_at?: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  user: UserProfile;
};

export type RefreshTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: UserProfile;
};

let storedRefreshToken: string | null = null;
let currentAuthenticatedUser: UserProfile | null = null;
const guestTokenByCreatorMap = new Map<number, string>();

export function getGuestTokenForCreator(creatorId: number): string | null {
  return guestTokenByCreatorMap.get(creatorId) || null;
}

export async function ensureGuestTokenForCreator(creatorId: number): Promise<string | null> {
  const cached = guestTokenByCreatorMap.get(creatorId);
  if (cached) return cached;

  try {
    const deviceId = await getOrCreateDeviceId();
    const info = getDeviceInfo();
    const response = await apiRequest<AuthResponse>('/api/v1/auth/guest', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ device_id: deviceId, device_info: info, creator_id: creatorId }),
    });

    if (response && response.access_token) {
      guestTokenByCreatorMap.set(creatorId, response.access_token);
      return response.access_token;
    }
  } catch (err) {
    console.warn(`[ensureGuestTokenForCreator] Notice for creator ${creatorId}:`, err);
  }
  return null;
}

const SESSION_FILE_PATH = `${RNFS.DocumentDirectoryPath}/user_session_v1.json`;
const USER_PLANS_DB_PATH = `${RNFS.DocumentDirectoryPath}/user_subscriptions_db.json`;

let userPlansCache: Record<string, { plan_id: string; chosen_plan: string; role: string }> = {};

async function initUserPlansCache() {
  try {
    const exists = await RNFS.exists(USER_PLANS_DB_PATH);
    if (exists) {
      const content = await RNFS.readFile(USER_PLANS_DB_PATH, 'utf8');
      userPlansCache = JSON.parse(content) || {};
    }
  } catch (e) {
    console.warn('[authService] Notice initializing user plans cache:', e);
  }
}
initUserPlansCache();

function getUserPlanForUserKey(userKey: string): { plan_id: string; chosen_plan: string; role: string } | null {
  const creatorKey = `creator_${getCreatorId()}`;
  return userPlansCache[userKey] || userPlansCache[creatorKey] || userPlansCache['global_active_subscription'] || null;
}

async function getSavedUserPlan(userKey: string): Promise<{ plan_id: string; chosen_plan: string; role: string } | null> {
  const creatorKey = `creator_${getCreatorId()}`;
  if (userPlansCache[userKey]) return userPlansCache[userKey];
  if (userPlansCache[creatorKey]) return userPlansCache[creatorKey];
  if (userPlansCache['global_active_subscription']) return userPlansCache['global_active_subscription'];

  try {
    const exists = await RNFS.exists(USER_PLANS_DB_PATH);
    if (exists) {
      const content = await RNFS.readFile(USER_PLANS_DB_PATH, 'utf8');
      const db = JSON.parse(content);
      if (db && typeof db === 'object') {
        const item = db[userKey] || db[creatorKey] || db['global_active_subscription'];
        if (item) {
          userPlansCache[userKey] = item;
          userPlansCache[creatorKey] = item;
          userPlansCache['global_active_subscription'] = item;
          return item;
        }
      }
    }
  } catch (e) {
    console.warn('[authService] Notice reading user plan DB:', e);
  }
  return null;
}

async function saveUserPlanToDb(userKey: string, planId: string, chosenPlan: string, role: string) {
  try {
    const creatorKey = `creator_${getCreatorId()}`;
    const entry = { plan_id: planId, chosen_plan: chosenPlan, role, savedAt: Date.now() };
    userPlansCache[userKey] = entry;
    userPlansCache[creatorKey] = entry;
    userPlansCache['global_active_subscription'] = entry;

    let db: Record<string, any> = {};
    const exists = await RNFS.exists(USER_PLANS_DB_PATH);
    if (exists) {
      const content = await RNFS.readFile(USER_PLANS_DB_PATH, 'utf8');
      db = JSON.parse(content) || {};
    }
    db[userKey] = entry;
    db[creatorKey] = entry;
    db['global_active_subscription'] = entry;
    await RNFS.writeFile(USER_PLANS_DB_PATH, JSON.stringify(db), 'utf8');
  } catch (e) {
    console.warn('[authService] Notice saving user plan to DB:', e);
  }
}

async function saveSessionToStorage(accessToken: string, refreshToken: string, user?: UserProfile) {
  try {
    const data = JSON.stringify({
      accessToken,
      refreshToken,
      user,
      creatorId: getCreatorId(),
      savedAt: Date.now(),
    });
    await RNFS.writeFile(SESSION_FILE_PATH, data, 'utf8');
  } catch (err) {
    console.warn('[authService] Failed to save session to storage:', err);
  }
}

async function removeSessionFromStorage() {
  try {
    const exists = await RNFS.exists(SESSION_FILE_PATH);
    if (exists) {
      await RNFS.unlink(SESSION_FILE_PATH);
    }
  } catch (err) {
    console.warn('[authService] Failed to remove session storage:', err);
  }
}

export async function restoreStoredSession(): Promise<UserProfile | null> {
  await initUserPlansCache();
  const activeCreatorId = getCreatorId();
  try {
    const exists = await RNFS.exists(SESSION_FILE_PATH);
    if (exists) {
      const content = await RNFS.readFile(SESSION_FILE_PATH, 'utf8');
      const parsed = JSON.parse(content);

      const storedCreatorId = parsed?.creatorId;
      const jwtCreatorId = decodeJwtCreatorId(parsed?.accessToken);

      if (
        !storedCreatorId ||
        Number(storedCreatorId) !== activeCreatorId ||
        (jwtCreatorId !== null && jwtCreatorId !== activeCreatorId)
      ) {
        console.log(`[authService] Resetting stored session due to creator ID mismatch (stored: ${storedCreatorId}, jwt: ${jwtCreatorId}, active: ${activeCreatorId})`);
        await removeSessionFromStorage();
        setApiAccessToken(null);
        currentAuthenticatedUser = null;
        storedRefreshToken = null;
      } else if (parsed && parsed.accessToken && parsed.user) {
        setApiAccessToken(parsed.accessToken);
        storedRefreshToken = parsed.refreshToken || null;
        currentAuthenticatedUser = parsed.user;
        (currentAuthenticatedUser as any)._creatorId = activeCreatorId;

        const userKey = getUserStorageKey();
        const savedPlan = await getSavedUserPlan(userKey);
        if (savedPlan && currentAuthenticatedUser) {
          currentAuthenticatedUser.plan_id = savedPlan.plan_id;
          currentAuthenticatedUser.chosen_plan = savedPlan.chosen_plan;
          currentAuthenticatedUser.role = savedPlan.role;
        }

        notifyAuthChange();
        return parsed.user;
      }
    }
  } catch (err) {
    console.warn('[authService] Error restoring session from storage:', err);
  }

  // Auto-provision guest JWT session token on initial launch for active creator ID
  try {
    const guestAuth = await loginAsGuest(undefined, activeCreatorId);
    return guestAuth.user;
  } catch (e) {
    console.warn('[authService] Initial guest auto-provision notice:', e);
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  return storedRefreshToken;
}

const authChangeListeners: Set<() => void> = new Set();

export function subscribeAuthChange(listener: () => void): () => void {
  authChangeListeners.add(listener);
  return () => {
    authChangeListeners.delete(listener);
  };
}

function notifyAuthChange() {
  authChangeListeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.warn('[authService] Error notifying auth listener:', e);
    }
  });
}

export function getUserStorageKeyForUser(user?: UserProfile | null): string {
  if (!user) return 'guest';
  if (user.email) {
    return user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  return `user_${user.id || 'anon'}`;
}

export function getUserStorageKey(): string {
  return getUserStorageKeyForUser(currentAuthenticatedUser);
}

export function getCurrentUser(): UserProfile | null {
  return currentAuthenticatedUser;
}

export function isUserLoggedIn(): boolean {
  if (!currentAuthenticatedUser) return false;
  const role = (currentAuthenticatedUser.role || '').toLowerCase();
  const planVal = (
    currentAuthenticatedUser.chosen_plan ||
    currentAuthenticatedUser.plan_id ||
    (currentAuthenticatedUser as any).plan ||
    ''
  ).toString().trim();
  const hasPlan = planVal.length > 0 && planVal !== 'null' && planVal !== 'undefined';

  if (hasPlan || ['subscriber', 'member', 'premium', 'admin', 'creator', 'vip'].includes(role)) {
    return true;
  }
  return currentAuthenticatedUser.provider !== 'guest' && role !== 'guest';
}

export function isUserSubscribed(): boolean {
  if (!currentAuthenticatedUser) {
    const savedPlan = getUserPlanForUserKey('guest');
    if (savedPlan) return true;
    return false;
  }
  const role = (currentAuthenticatedUser.role || '').toLowerCase();

  if (['admin', 'creator', 'premium', 'vip', 'subscriber'].includes(role)) {
    return true;
  }

  const planVal = (
    currentAuthenticatedUser.plan_id ||
    currentAuthenticatedUser.chosen_plan ||
    (currentAuthenticatedUser as any).plan ||
    ''
  ).toString().trim().toLowerCase();

  const hasPlan = planVal.length > 0 && planVal !== 'null' && planVal !== 'undefined' && planVal !== 'none';
  if (hasPlan) return true;

  // Hydrate from DB cache fallback
  const userKey = getUserStorageKey();
  const savedPlan = getUserPlanForUserKey(userKey);
  if (savedPlan) {
    currentAuthenticatedUser.plan_id = savedPlan.plan_id;
    currentAuthenticatedUser.chosen_plan = savedPlan.chosen_plan;
    currentAuthenticatedUser.role = savedPlan.role || 'subscriber';
    return true;
  }

  return false;
}

export function isUserAdFree(): boolean {
  if (!currentAuthenticatedUser) return false;

  // Hydrate plan if missing in memory
  if (!currentAuthenticatedUser.chosen_plan && !currentAuthenticatedUser.plan_id) {
    const userKey = getUserStorageKey();
    const savedPlan = getUserPlanForUserKey(userKey);
    if (savedPlan) {
      currentAuthenticatedUser.plan_id = savedPlan.plan_id;
      currentAuthenticatedUser.chosen_plan = savedPlan.chosen_plan;
      currentAuthenticatedUser.role = savedPlan.role || 'subscriber';
    }
  }

  const role = (currentAuthenticatedUser.role || '').toLowerCase();
  const planVal = (
    currentAuthenticatedUser.chosen_plan ||
    currentAuthenticatedUser.plan_id ||
    (currentAuthenticatedUser as any).plan ||
    ''
  ).toString().toLowerCase();

  if (['admin', 'creator'].includes(role)) return true;

  if (['subscriber', 'premium', 'vip'].includes(role) || planVal.length > 0) {
    if (planVal.includes('with_ads') || planVal.includes('ad-supported')) {
      return false;
    }
    return true;
  }
  return false;
}

export type SubscriptionTier = 'none' | 'basic' | 'premium';

export function getUserSubscriptionTier(): SubscriptionTier {
  if (!isUserSubscribed()) return 'none';
  const user = getCurrentUser();
  if (!user) return 'none';
  const planVal = (
    user.plan_id ||
    user.chosen_plan ||
    (user as any).plan ||
    ''
  ).toString().toLowerCase();
  const roleVal = (user.role || '').toLowerCase();

  if (
    planVal.includes('premium') ||
    planVal.includes('pro') ||
    planVal.includes('4k') ||
    planVal === '2' ||
    planVal === 'premium' ||
    roleVal === 'premium'
  ) {
    return 'premium';
  }
  return 'basic';
}

export function activateSubscription(
  role: 'member' | 'subscriber' | 'premium' = 'subscriber',
  planName: string = 'Premium Plan',
  planId?: string
): UserProfile {
  const baseUser = currentAuthenticatedUser || {
    id: 101,
    name: 'VIP Member',
    email: 'member@streamr.app',
    avatar_url: null,
    provider: 'subscriber',
    role: 'subscriber',
  };

  const isPrem = planId === 'premium' || planId === '2' || planName.toLowerCase().includes('premium');
  const targetRole = isPrem ? 'premium' : 'subscriber';
  const targetPlanId = planId || (isPrem ? 'premium' : 'basic');
  const targetPlanName = planName || (isPrem ? 'Premium Plan' : 'Basic Plan');

  const updatedUser: UserProfile = {
    ...baseUser,
    name: baseUser.name === 'Guest User' ? 'VIP Subscriber' : baseUser.name,
    provider: 'subscriber',
    role: targetRole,
    chosen_plan: targetPlanName,
    plan_id: targetPlanId,
  };

  currentAuthenticatedUser = updatedUser;
  (currentAuthenticatedUser as any)._creatorId = getCreatorId();

  const userKey = getUserStorageKeyForUser(updatedUser);
  saveUserPlanToDb(userKey, targetPlanId, targetPlanName, targetRole);

  saveSessionToStorage(
    getApiAccessToken() || DEFAULT_AUTH_TOKEN,
    storedRefreshToken || `sub_refresh_${Date.now()}`,
    updatedUser,
  );
  notifyAuthChange();
  return updatedUser;
}

export function setSessionTokens(accessToken: string, refreshToken: string, user?: UserProfile) {
  setApiAccessToken(accessToken);
  storedRefreshToken = refreshToken;
  if (user) {
    const userKey = getUserStorageKeyForUser(user);
    const savedPlan = getUserPlanForUserKey(userKey);

    const existingPlanName = savedPlan?.chosen_plan || user.chosen_plan || currentAuthenticatedUser?.chosen_plan;
    const existingPlanId = savedPlan?.plan_id || user.plan_id || currentAuthenticatedUser?.plan_id;
    const existingRole = savedPlan?.role || (existingPlanId === 'premium' ? 'premium' : 'subscriber');

    const isSubscribedAlready = Boolean(savedPlan) || Boolean(existingPlanId);

    currentAuthenticatedUser = {
      ...user,
      chosen_plan: user.chosen_plan || (isSubscribedAlready ? existingPlanName : undefined),
      plan_id: user.plan_id || (isSubscribedAlready ? existingPlanId : undefined),
      role: isSubscribedAlready ? existingRole : user.role,
    };
    (currentAuthenticatedUser as any)._creatorId = (user as any)._creatorId || getCreatorId();
  }
  saveSessionToStorage(accessToken, refreshToken, currentAuthenticatedUser || undefined);
  notifyAuthChange();
}

/**
 * 1. POST /api/v1/auth/guest — Anonymous Guest Session ("Skip Signup")
 * Issues an application JWT session for anonymous guest users skipping social login on app launch.
 */
export async function loginAsGuest(
  customDeviceInfo?: string,
  creatorId: number = getCreatorId()
): Promise<AuthResponse> {
  const activeSessionCreatorId = (currentAuthenticatedUser as any)?._creatorId;

  // If current active session belongs to a DIFFERENT creator ID, clear it immediately
  if (activeSessionCreatorId !== undefined && Number(activeSessionCreatorId) !== creatorId) {
    console.log(`[authService] Creator ID changed from ${activeSessionCreatorId} to ${creatorId}. Resetting guest session.`);
    setApiAccessToken(null);
    currentAuthenticatedUser = null;
    storedRefreshToken = null;
  }

  // If user is already logged in as a real non-guest user for the SAME creator ID, do NOT overwrite session
  if (
    (isUserSubscribed() || (isUserLoggedIn() && currentAuthenticatedUser?.provider !== 'guest')) &&
    Number((currentAuthenticatedUser as any)?._creatorId) === creatorId
  ) {
    return {
      access_token: getApiAccessToken() || DEFAULT_AUTH_TOKEN,
      refresh_token: storedRefreshToken || '',
      user: currentAuthenticatedUser!,
    };
  }

  // If already logged in as guest for the SAME creator ID, reuse session token
  if (
    isUserLoggedIn() &&
    currentAuthenticatedUser?.provider === 'guest' &&
    Number(activeSessionCreatorId) === creatorId &&
    getApiAccessToken()
  ) {
    return {
      access_token: getApiAccessToken()!,
      refresh_token: storedRefreshToken || '',
      user: currentAuthenticatedUser!,
    };
  }

  // Otherwise, clear previous guest session and request a fresh guest token for creatorId from backend
  setApiAccessToken(null);
  currentAuthenticatedUser = null;
  storedRefreshToken = null;

  const deviceId = await getOrCreateDeviceId();
  const info = customDeviceInfo || getDeviceInfo();

  const fallbackGuestProfile: UserProfile = {
    id: 99,
    name: 'Guest User',
    email: null,
    avatar_url: null,
    provider: 'guest',
    role: 'guest',
  };

  try {
    const response = await apiRequest<AuthResponse>('/api/v1/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, device_info: info, creator_id: creatorId }),
    });

    const guestUser = response.user || fallbackGuestProfile;
    (guestUser as any)._creatorId = creatorId;
    if (response.access_token) {
      guestTokenByCreatorMap.set(creatorId, response.access_token);
    }
    setSessionTokens(response.access_token, response.refresh_token, guestUser);
    return response;
  } catch (e) {
    console.warn('[authService] Notice initializing guest session with live backend:', e);

    const fallbackResponse: AuthResponse = {
      access_token: `guest_access_${Date.now()}`,
      refresh_token: `guest_refresh_${Date.now()}`,
      user: fallbackGuestProfile,
    };
    (fallbackGuestProfile as any)._creatorId = creatorId;
    setSessionTokens(fallbackResponse.access_token, fallbackResponse.refresh_token, fallbackGuestProfile);
    return fallbackResponse;
  }
}

/**
 * 2. POST /api/v1/auth/social-login — Social Login (Google / Auth0 / Guest Upgrade)
 */
export async function loginWithSocialToken(
  provider: 'google' | 'auth0' | 'apple' | string,
  token: string,
  customDeviceInfo?: string,
  userProfileOverride?: UserProfile,
  creatorId: number = getCreatorId()
): Promise<AuthResponse> {
  if (provider === 'guest') {
    return loginAsGuest(customDeviceInfo, creatorId);
  }

  const info = customDeviceInfo || getDeviceInfo();

  if (USE_MOCK_VIDEOS) {
    const mockAuth: AuthResponse = {
      access_token: `mock_access_token_${Date.now()}`,
      refresh_token: `mock_refresh_token_${Date.now()}`,
      token_type: 'bearer',
      expires_in: 1800,
      user: userProfileOverride || {
        id: 99,
        name: provider === 'google' ? 'Jane Doe' : 'John Smith',
        email: provider === 'google' ? 'jane.doe@gmail.com' : 'john.smith@facebook.com',
        avatar_url: 'https://lh3.googleusercontent.com/a/AEdFT...',
        provider,
        role: 'member',
      },
    };
    setSessionTokens(mockAuth.access_token, mockAuth.refresh_token, mockAuth.user);
    return mockAuth;
  }

  const endpoint = provider === 'google' ? '/api/v1/auth/google' : '/api/v1/auth/facebook';
  const body =
    provider === 'google'
      ? JSON.stringify({ creator_id: creatorId, id_token: token, device_info: info })
      : JSON.stringify({ creator_id: creatorId, access_token: token, device_info: info });

  // Pass current guest token in Authorization header if upgrading an active Guest session
  const currentToken = getApiAccessToken();
  const isGuestUpgrade = Boolean(currentAuthenticatedUser?.provider === 'guest' && currentToken && currentToken !== DEFAULT_AUTH_TOKEN);

  try {
    const response = await apiRequest<AuthResponse>(endpoint, {
      method: 'POST',
      authenticated: isGuestUpgrade,
      body,
    });

    const activeUser = userProfileOverride || response.user;
    setSessionTokens(response.access_token, response.refresh_token, activeUser);
    return response;
  } catch (error) {
    console.warn(`[loginWithSocial] Endpoint ${endpoint} notice (falling back to guest session token):`, error);

    const guestAuth = await loginAsGuest(info, creatorId);
    const activeUser: UserProfile = userProfileOverride || {
      id: guestAuth.user?.id || 99,
      name: provider === 'google' ? 'Google User' : 'Facebook User',
      email: provider === 'google' ? 'user@gmail.com' : 'user@facebook.com',
      avatar_url: null,
      provider,
      role: 'member',
      chosen_plan: null,
      plan_id: null,
    };

    setSessionTokens(guestAuth.access_token, guestAuth.refresh_token, activeUser);
    return {
      ...guestAuth,
      user: activeUser,
    };
  }
}

export const loginWithSocial = loginWithSocialToken;

/**
 * 4. POST /api/v1/auth/refresh — Refresh Access Token
 * Rotates a 60-day Refresh Token to issue a fresh 30-minute Access Token.
 */
export async function refreshAccessToken(): Promise<string> {
  const activeCreatorId = getCreatorId();
  if (!storedRefreshToken || storedRefreshToken.startsWith('mock_') || storedRefreshToken.startsWith('guest_')) {
    const guestRes = await loginAsGuest(undefined, activeCreatorId);
    return guestRes.access_token;
  }

  try {
    const response = await apiRequest<RefreshTokenResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({
        refresh_token: storedRefreshToken,
      }),
    });

    setSessionTokens(response.access_token, response.refresh_token || storedRefreshToken, response.user || currentAuthenticatedUser || undefined);
    return response.access_token;
  } catch (error) {
    console.warn('[refreshAccessToken] Failed to refresh token, auto-issuing guest session token:', error);
    const guestRes = await loginAsGuest(undefined, activeCreatorId);
    return guestRes.access_token;
  }
}

/**
 * 5. POST /api/v1/auth/logout — Revoke Session
 * Revokes the refresh token and terminates the subscriber's session.
 */
export async function clearSessionTokens() {
  if (storedRefreshToken && !storedRefreshToken.startsWith('mock_') && !storedRefreshToken.startsWith('guest_')) {
    try {
      await apiRequest<{ success: boolean; message?: string }>('/api/v1/auth/logout', {
        method: 'POST',
        authenticated: true,
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });
    } catch (err) {
      console.warn('[clearSessionTokens] Logout API notice:', err);
    }
  }

  storedRefreshToken = null;
  currentAuthenticatedUser = null;
  await removeSessionFromStorage();

  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    if (GoogleSignin) {
      await GoogleSignin.signOut();
      try {
        await GoogleSignin.revokeAccess();
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }

  // Auto-issue a fresh Guest JWT token so catalog endpoints remain 200 OK
  try {
    await loginAsGuest();
  } catch (e) {
    setApiAccessToken(DEFAULT_AUTH_TOKEN);
    notifyAuthChange();
  }
}

/**
 * 6. GET /api/v1/auth/me — Get Subscriber Profile
 * Returns current subscriber identity details.
 */
export async function fetchUserProfileApi(): Promise<UserProfile | null> {
  const endpoints = ['/api/v1/auth/me', '/api/v1/admin/auth/me'];

  for (const ep of endpoints) {
    try {
      const rawRes = await apiRequest<any>(ep, {
        method: 'GET',
        authenticated: true,
      });
      if (rawRes) {
        const fullName = [rawRes.first_name, rawRes.last_name].filter(Boolean).join(' ').trim();
        const derivedName = rawRes.name || rawRes.studio_name || (fullName.length > 0 ? fullName : 'User');
        const role = rawRes.role || (ep.includes('/admin/') ? 'admin' : 'member');
        const calculatedCreatorId = role === 'admin' ? (rawRes.id || getCreatorId()) : (rawRes.creator_id || getCreatorId());

        const activePlanName = rawRes.chosen_plan || currentAuthenticatedUser?.chosen_plan || null;
        const activePlanId = rawRes.plan_id || currentAuthenticatedUser?.plan_id || null;
        const isSub = Boolean(activePlanId || activePlanName || ['subscriber', 'premium', 'admin', 'creator', 'vip'].includes((rawRes.role || '').toLowerCase()));

        const mergedUser: UserProfile = {
          id: rawRes.id || currentAuthenticatedUser?.id || 1,
          name: derivedName,
          email: rawRes.email || null,
          avatar_url: rawRes.avatar_url || null,
          provider: rawRes.provider || (role === 'admin' ? 'admin' : 'member'),
          role: isSub ? (activePlanId === 'premium' || role === 'premium' ? 'premium' : 'subscriber') : (role || 'member'),
          chosen_plan: isSub ? activePlanName : null,
          plan_id: isSub ? activePlanId : null,
          created_at: rawRes.created_at,
        };

        (mergedUser as any)._creatorId = calculatedCreatorId;
        currentAuthenticatedUser = mergedUser;
        notifyAuthChange();
        return mergedUser;
      }
    } catch (err) {
      // Continue to next candidate endpoint
    }
  }

  return currentAuthenticatedUser;
}
