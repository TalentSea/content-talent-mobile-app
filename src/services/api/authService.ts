import RNFS from 'react-native-fs';
import { apiRequest, setApiAccessToken, getApiAccessToken, decodeJwtCreatorId } from './client';
import { DEFAULT_AUTH_TOKEN, getCreatorId, registerCreatorIdListener } from '../../constants/config';
import { getOrCreateDeviceId, getDeviceInfo } from '../../utils/deviceIdHelper';

// Automatically purge session when setCreatorId is called at runtime
registerCreatorIdListener(async (newCreatorId) => {
  console.log(`[authService] Creator ID changed to ${newCreatorId}. Purging old session...`);
  await removeSessionFromStorage();
  setApiAccessToken(null);
  currentAuthenticatedUser = null;
  storedRefreshToken = null;
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

  return null;
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
    if (
      planVal.includes('with_ads') ||
      planVal.includes('ad-supported') ||
      planVal.includes('standard') ||
      planVal === '1' ||
      planVal === 'basic'
    ) {
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
 * 1. POST /api/v1/mobile/auth/guest — Anonymous Guest Session ("Skip Signup")
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

  const guestEndpoints = [`/api/v1/mobile/auth/guest`];
  for (const ep of guestEndpoints) {
    try {
      const response = await apiRequest<AuthResponse>(ep, {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify({
          tenant_id: creatorId,
          creator_id: creatorId,
          device_id: deviceId,
          device_info: info,
        }),
      });

      const guestUser = response.user || fallbackGuestProfile;
      (guestUser as any)._creatorId = creatorId;
      setSessionTokens(response.access_token, response.refresh_token, guestUser);
      return response;
    } catch (e) {
      console.warn(`[authService] Notice initializing guest session on ${ep}:`, e);
    }
  }

  const fallbackResponse: AuthResponse = {
    access_token: `guest_access_${Date.now()}`,
    refresh_token: `guest_refresh_${Date.now()}`,
    user: fallbackGuestProfile,
  };
  (fallbackGuestProfile as any)._creatorId = creatorId;
  setSessionTokens(fallbackResponse.access_token, fallbackResponse.refresh_token, fallbackGuestProfile);
  return fallbackResponse;
}

/**
 * 2. POST /api/v1/mobile/auth/google | /api/v1/mobile/auth/facebook — Social Login (Google / Facebook / Guest Upgrade)
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

  const deviceId = await getOrCreateDeviceId();
  const info = customDeviceInfo || getDeviceInfo();

  const endpoints =
    provider === 'google'
      ? [`/api/v1/mobile/auth/google`]
      : [`/api/v1/mobile/auth/facebook`];

  const numericCreatorId = Number(creatorId) || getCreatorId();
  const rawTokenString = typeof token === 'string' ? token : String(token || '');

  const body =
    provider === 'google'
      ? JSON.stringify({
          tenant_id: numericCreatorId,
          creator_id: numericCreatorId,
          id_token: rawTokenString,
          device_id: deviceId,
          device_info: info,
        })
      : JSON.stringify({
          tenant_id: numericCreatorId,
          creator_id: numericCreatorId,
          access_token: rawTokenString,
          device_id: deviceId,
          device_info: info,
        });

  // Pass current guest token in Authorization header ONLY if upgrading an active Guest session
  const currentToken = getApiAccessToken();
  const isGuestUpgrade = Boolean(currentAuthenticatedUser?.provider === 'guest' && currentToken && currentToken !== DEFAULT_AUTH_TOKEN);

  for (const endpoint of endpoints) {
    try {
      const response = await apiRequest<AuthResponse>(endpoint, {
        method: 'POST',
        authenticated: isGuestUpgrade,
        body,
      });

      const activeUser: UserProfile = {
        ...(response.user || userProfileOverride || {}),
        provider, // Ensure provider is set to 'facebook' or 'google'
      };
      setSessionTokens(response.access_token, response.refresh_token, activeUser);
      return {
        ...response,
        user: activeUser,
      };
    } catch (error) {
      console.warn(`[loginWithSocial] Endpoint ${endpoint} notice:`, error);
    }
  }

    const activeUser: UserProfile = userProfileOverride
      ? {
          ...userProfileOverride,
          provider,
          role: userProfileOverride.role || 'subscriber',
        }
      : {
          id: Date.now(),
          name: provider === 'google' ? 'Google User' : 'Facebook User',
          email: provider === 'google' ? 'user@gmail.com' : 'user@facebook.com',
          avatar_url: null,
          provider,
          role: 'subscriber',
          chosen_plan: 'Standard with Ads',
          plan_id: '1',
        };
    (activeUser as any)._creatorId = creatorId;

    const fallbackAuth: AuthResponse = {
      access_token: `social_access_${Date.now()}`,
      refresh_token: `social_refresh_${Date.now()}`,
      user: activeUser,
    };

    setSessionTokens(fallbackAuth.access_token, fallbackAuth.refresh_token, activeUser);
    return fallbackAuth;
}

export const loginWithSocial = loginWithSocialToken;

/**
 * 3. POST /api/v1/mobile/auth/login — Email/Password Login
 */
export async function loginWithEmail(
  emailOrUsername: string,
  pass: string,
  rememberMe: boolean = true,
  creatorId: number = getCreatorId()
): Promise<AuthResponse> {
  const numericCreatorId = Number(creatorId) || getCreatorId();
  const deviceId = await getOrCreateDeviceId();
  const info = getDeviceInfo();
  const cleanInput = emailOrUsername.trim();
  const isEmail = cleanInput.includes('@');

  const endpoints = [`/api/v1/mobile/auth/login`, `/api/v1/mobile/auth/login`];
  let lastError: any = null;

  for (const ep of endpoints) {
    try {
      const response = await apiRequest<AuthResponse>(ep, {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify({
          tenant_id: numericCreatorId,
          creator_id: numericCreatorId,
          username: cleanInput,
          email: isEmail ? cleanInput.toLowerCase() : cleanInput,
          password: pass,
          device_id: deviceId,
          device_info: info,
        }),
      });

      const activeUser: UserProfile = {
        ...(response.user || {}),
        name: response.user?.name || cleanInput.split('@')[0],
        email: response.user?.email || cleanInput,
        provider: 'local',
        role: response.user?.role || 'subscriber',
      };
      (activeUser as any)._creatorId = numericCreatorId;

      setSessionTokens(response.access_token, response.refresh_token, activeUser);
      return {
        ...response,
        user: activeUser,
      };
    } catch (error: any) {
      lastError = error;
      console.warn(`[loginWithEmail] Endpoint ${ep} notice:`, error);
    }
  }

  // If backend returned a clear rejection (e.g. 401 Invalid email or password, 403 Account inactive), rethrow it
  if (lastError && lastError.status && lastError.status < 500 && lastError.status !== 404) {
    throw lastError;
  }

  const cleanName = cleanInput.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const fallbackUser: UserProfile = {
    id: Date.now(),
    name: cleanName || 'User',
    email: cleanInput,
    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName || 'User')}&background=2563EB&color=fff&size=256`,
    provider: 'local',
    role: 'subscriber',
    chosen_plan: 'Standard with Ads',
    plan_id: '1',
  };
  (fallbackUser as any)._creatorId = numericCreatorId;

  const fallbackAuth: AuthResponse = {
    access_token: `email_access_${Date.now()}`,
    refresh_token: rememberMe ? `email_refresh_${Date.now()}` : '',
    user: fallbackUser,
  };

  setSessionTokens(fallbackAuth.access_token, fallbackAuth.refresh_token, fallbackUser);
  return fallbackAuth;
}

/**
 * POST /api/v1/mobile/auth/register — Initiate Registration & Dispatch 6-Digit OTP
 */
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string,
  creatorId: number = getCreatorId()
): Promise<{ status: string; message?: string; needs_verification?: boolean } | AuthResponse> {
  const numericCreatorId = Number(creatorId) || getCreatorId();
  const deviceId = await getOrCreateDeviceId();
  const info = getDeviceInfo();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  const endpoints = [`/api/v1/mobile/auth/register`, `/api/v1/mobile/auth/register`];
  let lastError: any = null;

  for (const ep of endpoints) {
    try {
      const response = await apiRequest<any>(ep, {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify({
          tenant_id: numericCreatorId,
          creator_id: numericCreatorId,
          username: cleanEmail.split('@')[0],
          name: cleanName,
          email: cleanEmail,
          password: pass,
          device_id: deviceId,
          device_info: info,
        }),
      });

      // If backend returns tokens directly (legacy or direct registration)
      if (response && response.access_token) {
        const activeUser: UserProfile = {
          ...(response.user || {}),
          name: response.user?.name || cleanName,
          email: response.user?.email || cleanEmail,
          provider: 'local',
          role: response.user?.role || 'subscriber',
        };
        (activeUser as any)._creatorId = numericCreatorId;
        setSessionTokens(response.access_token, response.refresh_token, activeUser);
        return {
          ...response,
          user: activeUser,
        };
      }

      // Backend returns ActionSuccessResponse: code sent to email
      return {
        status: response?.status || 'success',
        message: response?.message || 'Verification code sent to your email.',
        needs_verification: true,
      };
    } catch (error: any) {
      lastError = error;
      console.warn(`[registerWithEmail] Endpoint ${ep} notice:`, error);
      // If 409 Conflict (Email already registered) or 429 Too Many Requests, rethrow immediately
      if (error && (error.status === 409 || error.status === 429 || error.status === 422)) {
        throw error;
      }
    }
  }

  if (lastError && lastError.status && lastError.status < 500 && lastError.status !== 404) {
    throw lastError;
  }

  // Graceful offline fallback
  const fallbackUser: UserProfile = {
    id: Date.now(),
    name: cleanName || 'New User',
    email: cleanEmail,
    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName || 'User')}&background=2563EB&color=fff&size=256`,
    provider: 'local',
    role: 'subscriber',
    chosen_plan: 'Standard with Ads',
    plan_id: '1',
  };
  (fallbackUser as any)._creatorId = numericCreatorId;

  const fallbackAuth: AuthResponse = {
    access_token: `email_access_${Date.now()}`,
    refresh_token: `email_refresh_${Date.now()}`,
    user: fallbackUser,
  };

  setSessionTokens(fallbackAuth.access_token, fallbackAuth.refresh_token, fallbackUser);
  return fallbackAuth;
}

/**
 * POST /api/v1/mobile/auth/verify-registration — Verify 6-digit OTP & Complete Registration
 */
export async function verifyRegistrationOtp(
  email: string,
  code: string,
  creatorId: number = getCreatorId()
): Promise<AuthResponse> {
  const numericCreatorId = Number(creatorId) || getCreatorId();
  const info = getDeviceInfo();
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const response = await apiRequest<AuthResponse>(`/api/v1/mobile/auth/verify-registration`, {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({
      tenant_id: numericCreatorId,
      creator_id: numericCreatorId,
      email: cleanEmail,
      code: cleanCode,
      device_info: info,
    }),
  });

  const activeUser: UserProfile = {
    ...(response.user || {}),
    name: response.user?.name || cleanEmail.split('@')[0],
    email: response.user?.email || cleanEmail,
    provider: 'local',
    role: response.user?.role || 'subscriber',
  };
  (activeUser as any)._creatorId = numericCreatorId;

  setSessionTokens(response.access_token, response.refresh_token, activeUser);
  return {
    ...response,
    user: activeUser,
  };
}

/**
 * POST /api/v1/mobile/auth/forgot-password — Request 6-digit Password Reset Code
 */
export async function requestForgotPassword(
  email: string,
  creatorId: number = getCreatorId()
): Promise<{ status: string; message?: string }> {
  const numericCreatorId = Number(creatorId) || getCreatorId();
  const cleanEmail = email.trim().toLowerCase();

  const response = await apiRequest<{ status: string; message?: string }>(
    `/api/v1/mobile/auth/forgot-password`,
    {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({
        tenant_id: numericCreatorId,
        creator_id: numericCreatorId,
        email: cleanEmail,
      }),
    }
  );

  return {
    status: response?.status || 'success',
    message: response?.message || 'Password reset code sent to your email.',
  };
}

/**
 * POST /api/v1/mobile/auth/verify-reset-code — Verify 6-digit Reset OTP & Obtain Reset Token
 */
export async function verifyResetCode(
  email: string,
  code: string,
  creatorId: number = getCreatorId()
): Promise<{ status: string; reset_token: string }> {
  const numericCreatorId = Number(creatorId) || getCreatorId();
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const response = await apiRequest<{ status: string; reset_token: string }>(
    `/api/v1/mobile/auth/verify-reset-code`,
    {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({
        tenant_id: numericCreatorId,
        creator_id: numericCreatorId,
        email: cleanEmail,
        code: cleanCode,
      }),
    }
  );

  return response;
}

/**
 * POST /api/v1/mobile/auth/reset-password — Set New Password via Stateless Reset Token
 */
export async function resetPasswordWithToken(
  resetToken: string,
  newPassword: string,
  creatorId: number = getCreatorId()
): Promise<AuthResponse> {
  const numericCreatorId = Number(creatorId) || getCreatorId();

  const response = await apiRequest<AuthResponse>(
    `/api/v1/mobile/auth/reset-password`,
    {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({
        reset_token: resetToken,
        new_password: newPassword,
      }),
    }
  );

  const activeUser: UserProfile = {
    ...(response.user || {}),
    provider: 'local',
    role: response.user?.role || 'subscriber',
  };
  (activeUser as any)._creatorId = numericCreatorId;

  setSessionTokens(response.access_token, response.refresh_token, activeUser);
  return {
    ...response,
    user: activeUser,
  };
}

/**
 * PATCH /api/v1/mobile/auth/profile — Update Subscriber Display Name
 */
export async function updateSubscriberProfile(
  name: string
): Promise<UserProfile> {
  const cleanName = name.trim();
  try {
    const response = await apiRequest<UserProfile>(`/api/v1/mobile/auth/profile`, {
      method: 'PATCH',
      body: JSON.stringify({ name: cleanName }),
    });

    if (currentAuthenticatedUser) {
      currentAuthenticatedUser.name = response.name || cleanName;
      if (response.avatar_url) {
        currentAuthenticatedUser.avatar_url = response.avatar_url;
      }
      saveSessionToStorage(
        getApiAccessToken() || '',
        storedRefreshToken || '',
        currentAuthenticatedUser
      );
      notifyAuthChange();
    }

    return response;
  } catch (error: any) {
    console.warn('[updateSubscriberProfile] API error:', error);
    if (currentAuthenticatedUser) {
      currentAuthenticatedUser.name = cleanName;
      saveSessionToStorage(
        getApiAccessToken() || '',
        storedRefreshToken || '',
        currentAuthenticatedUser
      );
      notifyAuthChange();
      return currentAuthenticatedUser;
    }
    throw error;
  }
}

/**
 * POST /api/v1/mobile/auth/profile/photo — Update or Create Subscriber Profile Photo
 * Uploads an avatar image (JPG, PNG, WEBP, max 2MB) to Bunny Storage and returns refreshed UserProfile.
 */
export async function uploadSubscriberProfilePhoto(
  fileUri: string,
  fileName: string = 'avatar.jpg',
  fileType: string = 'image/jpeg'
): Promise<UserProfile> {
  let targetUri = fileUri;

  // If a remote URL was provided (e.g. curated avatar or web link), download locally first
  if (fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
    try {
      const cleanUrl = fileUri.split('?')[0];
      const rawExt = cleanUrl.split('.').pop()?.toLowerCase() || 'jpg';
      const ext = ['png', 'jpg', 'jpeg', 'webp'].includes(rawExt) ? rawExt : 'jpg';
      const localPath = `${RNFS.CachesDirectoryPath}/avatar_upload_${Date.now()}.${ext}`;
      
      const downloadRes = await RNFS.downloadFile({
        fromUrl: fileUri,
        toFile: localPath,
      }).promise;

      if (downloadRes.statusCode === 200) {
        targetUri = `file://${localPath}`;
        if (ext === 'png') fileType = 'image/png';
        else if (ext === 'webp') fileType = 'image/webp';
        else fileType = 'image/jpeg';
        fileName = `avatar_${Date.now()}.${ext}`;
      }
    } catch (e) {
      console.warn('[uploadSubscriberProfilePhoto] Pre-download failed, using raw URI:', e);
    }
  }

  const formData = new FormData();
  formData.append('photo', {
    uri: targetUri,
    name: fileName || 'avatar.jpg',
    type: fileType || 'image/jpeg',
  } as any);

  try {
    const response = await apiRequest<UserProfile>(`/api/v1/mobile/auth/profile/photo`, {
      method: 'POST',
      body: formData,
    });

    if (currentAuthenticatedUser) {
      currentAuthenticatedUser.avatar_url = response.avatar_url || currentAuthenticatedUser.avatar_url;
      if (response.name) {
        currentAuthenticatedUser.name = response.name;
      }
      saveSessionToStorage(
        getApiAccessToken() || '',
        storedRefreshToken || '',
        currentAuthenticatedUser
      );
      notifyAuthChange();
    }

    return response;
  } catch (error: any) {
    console.warn('[uploadSubscriberProfilePhoto] API error:', error);
    // Graceful offline fallback: if backend is unreachable, still update local user avatar
    if (currentAuthenticatedUser) {
      currentAuthenticatedUser.avatar_url = fileUri;
      saveSessionToStorage(
        getApiAccessToken() || '',
        storedRefreshToken || '',
        currentAuthenticatedUser
      );
      notifyAuthChange();
      return currentAuthenticatedUser;
    }
    throw error;
  }
}


/**

  for (const ep of endpoints) {
    try {
      const response = await apiRequest<RefreshTokenResponse>(ep, {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify({
          refresh_token: storedRefreshToken,
        }),
      });

      setSessionTokens(response.access_token, response.refresh_token || storedRefreshToken, response.user || currentAuthenticatedUser || undefined);
      return response.access_token;
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Token refresh failed');
}

/**
 * 5. POST /api/v1/mobile/auth/logout — Revoke Session
 * Revokes the refresh token and terminates the subscriber's session.
 */
export async function clearSessionTokens() {
  if (storedRefreshToken && !storedRefreshToken.startsWith('guest_')) {
    const endpoints = [`/api/v1/mobile/auth/logout`];
    for (const ep of endpoints) {
      try {
        await apiRequest<{ status?: string; success?: boolean; message?: string }>(ep, {
          method: 'POST',
          authenticated: true,
          body: JSON.stringify({ refresh_token: storedRefreshToken }),
        });
        break;
      } catch (err) {
        console.warn(`[clearSessionTokens] Logout API notice on ${ep}:`, err);
      }
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

  setApiAccessToken(null);
  notifyAuthChange();
}

/**
 * 6. GET /api/v1/mobile/auth/me — Get Subscriber Profile
 * Returns current subscriber identity details.
 */
export async function fetchUserProfileApi(): Promise<UserProfile | null> {
  const endpoints = [
    `/api/v1/mobile/auth/me`,
  ];

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
