import RNFS from 'react-native-fs';
import { apiRequest, setApiAccessToken, getApiAccessToken } from './client';
import { USE_MOCK_VIDEOS, DEFAULT_AUTH_TOKEN } from '../../constants/config';
import { getOrCreateDeviceId, getDeviceInfo } from '../../utils/deviceIdHelper';

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

async function saveSessionToStorage(accessToken: string, refreshToken: string, user?: UserProfile) {
  try {
    const data = JSON.stringify({
      accessToken,
      refreshToken,
      user,
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
  try {
    const exists = await RNFS.exists(SESSION_FILE_PATH);
    if (exists) {
      const content = await RNFS.readFile(SESSION_FILE_PATH, 'utf8');
      const parsed = JSON.parse(content);

      if (parsed && parsed.accessToken && parsed.user) {
        setApiAccessToken(parsed.accessToken);
        storedRefreshToken = parsed.refreshToken || null;
        currentAuthenticatedUser = parsed.user;
        notifyAuthChange();
        return parsed.user;
      }
    }
  } catch (err) {
    console.warn('[authService] Error restoring session from storage:', err);
  }

  // Auto-provision guest JWT session token on initial launch if no stored session
  try {
    const guestAuth = await loginAsGuest();
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
  authChangeListeners.forEach(fn => fn());
}

export function getUserStorageKey(): string {
  if (!currentAuthenticatedUser) return 'guest';
  if (currentAuthenticatedUser.email) {
    return currentAuthenticatedUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  return `user_${currentAuthenticatedUser.id || 'anon'}`;
}

export function getCurrentUser(): UserProfile | null {
  return currentAuthenticatedUser;
}

export function isUserLoggedIn(): boolean {
  if (!currentAuthenticatedUser) return false;
  const provider = currentAuthenticatedUser.provider;
  const role = currentAuthenticatedUser.role;
  return provider !== 'guest' && role !== 'guest';
}

export function isUserSubscribed(): boolean {
  if (!isUserLoggedIn()) return false;
  const role = currentAuthenticatedUser?.role?.toLowerCase() || '';
  const hasPlan = !!currentAuthenticatedUser?.chosen_plan || !!currentAuthenticatedUser?.plan_id;
  return ['member', 'subscriber', 'premium', 'admin', 'creator', 'vip'].includes(role) || hasPlan;
}

export function activateSubscription(
  role: 'member' | 'subscriber' | 'premium' = 'member',
  planName: string = 'Premium Plan',
  planId?: string
): UserProfile {
  const updatedUser: UserProfile = currentAuthenticatedUser
    ? {
        ...currentAuthenticatedUser,
        role,
        chosen_plan: planName,
        plan_id: planId || currentAuthenticatedUser.plan_id,
      }
    : {
        id: 101,
        name: 'VIP Member',
        email: 'member@streamr.app',
        provider: 'google',
        role,
        chosen_plan: planName,
        plan_id: planId,
      };

  currentAuthenticatedUser = updatedUser;
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
    currentAuthenticatedUser = user;
  }
  saveSessionToStorage(accessToken, refreshToken, user || currentAuthenticatedUser || undefined);
  notifyAuthChange();
}

/**
 * 1. POST /api/v1/auth/guest — Anonymous Guest Session ("Skip Signup")
 * Issues an application JWT session for anonymous guest users skipping social login on app launch.
 */
export async function loginAsGuest(
  customDeviceInfo?: string,
  creatorId: number = 1
): Promise<AuthResponse> {
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
      authenticated: false,
      body: JSON.stringify({
        creator_id: creatorId,
        device_id: deviceId,
        device_info: info,
      }),
    });

    const activeUser = response.user || fallbackGuestProfile;
    setSessionTokens(response.access_token, response.refresh_token, activeUser);
    return response;
  } catch (error) {
    console.warn('[loginAsGuest] Server guest endpoint notice (using fallback):', error);
    const guestAuth: AuthResponse = {
      access_token: DEFAULT_AUTH_TOKEN,
      refresh_token: `guest_refresh_${Date.now()}`,
      token_type: 'bearer',
      expires_in: 1800,
      user: fallbackGuestProfile,
    };
    setSessionTokens(guestAuth.access_token, guestAuth.refresh_token, guestAuth.user);
    return guestAuth;
  }
}

/**
 * 2 & 3. POST /api/v1/auth/google & POST /api/v1/auth/facebook — Sign-In & Account Upgrade
 * Exchanges Google OIDC id_token or Facebook access_token for application JWT.
 * If header Authorization: Bearer <guest_access_token> is present, the backend upgrades the existing guest account into a permanent subscriber account!
 */
export async function loginWithSocial(
  provider: SocialProvider,
  token: string,
  customDeviceInfo?: string,
  userProfileOverride?: UserProfile,
  creatorId: number = 1
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
        role: 'subscriber',
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
    console.warn(`[loginWithSocial] Endpoint ${endpoint} notice:`, error);
    const mockAuth: AuthResponse = {
      access_token: DEFAULT_AUTH_TOKEN,
      refresh_token: `mock_refresh_token_${Date.now()}`,
      token_type: 'bearer',
      expires_in: 1800,
      user: userProfileOverride || currentAuthenticatedUser || {
        id: 99,
        name: provider === 'google' ? 'Jane Doe' : 'John Smith',
        email: provider === 'google' ? 'jane.doe@gmail.com' : 'john.smith@facebook.com',
        avatar_url: 'https://lh3.googleusercontent.com/a/AEdFT...',
        provider,
        role: 'subscriber',
      },
    };
    setSessionTokens(mockAuth.access_token, mockAuth.refresh_token, mockAuth.user);
    return mockAuth;
  }
}

/**
 * 4. POST /api/v1/auth/refresh — Refresh Access Token
 * Rotates a 60-day Refresh Token to issue a fresh 30-minute Access Token.
 */
export async function refreshAccessToken(): Promise<string> {
  if (!storedRefreshToken || storedRefreshToken.startsWith('mock_') || storedRefreshToken.startsWith('guest_')) {
    try {
      const guestRes = await loginAsGuest();
      return guestRes.access_token;
    } catch (e) {
      setApiAccessToken(DEFAULT_AUTH_TOKEN);
      return DEFAULT_AUTH_TOKEN;
    }
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
    try {
      const guestRes = await loginAsGuest();
      return guestRes.access_token;
    } catch (e) {
      setApiAccessToken(DEFAULT_AUTH_TOKEN);
      return DEFAULT_AUTH_TOKEN;
    }
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
  try {
    const profile = await apiRequest<UserProfile>('/api/v1/auth/me', {
      method: 'GET',
      authenticated: true,
    });
    if (profile) {
      currentAuthenticatedUser = profile;
      notifyAuthChange();
      return profile;
    }
  } catch (err) {
    console.warn('[fetchUserProfileApi] Error fetching current user profile:', err);
  }
  return currentAuthenticatedUser;
}
