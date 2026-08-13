import RNFS from 'react-native-fs';
import { apiRequest, setApiAccessToken } from './client';
import { USE_MOCK_VIDEOS, DEFAULT_AUTH_TOKEN } from '../../constants/config';

export type SocialProvider = 'google' | 'facebook' | 'guest';

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  provider: string;
  role: string; // 'guest' | 'subscriber' | 'premium' | 'admin' | 'creator'
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  user: UserProfile;
};

export type RefreshTokenResponse = {
  access_token: string;
  refresh_token?: string;
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
    if (!exists) return null;

    const content = await RNFS.readFile(SESSION_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content);

    if (parsed && parsed.accessToken && parsed.user) {
      setApiAccessToken(parsed.accessToken);
      storedRefreshToken = parsed.refreshToken || null;
      currentAuthenticatedUser = parsed.user;
      notifyAuthChange();
      return parsed.user;
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

export function setSessionTokens(accessToken: string, refreshToken: string, user?: UserProfile) {
  setApiAccessToken(accessToken);
  storedRefreshToken = refreshToken;
  if (user) {
    currentAuthenticatedUser = user;
  }
  saveSessionToStorage(accessToken, refreshToken, user || currentAuthenticatedUser || undefined);
  notifyAuthChange();
}

export async function clearSessionTokens() {
  setApiAccessToken(DEFAULT_AUTH_TOKEN);
  storedRefreshToken = null;
  currentAuthenticatedUser = null;
  await removeSessionFromStorage();
  notifyAuthChange();

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
}

/**
 * Creates an anonymous Guest Access Token for unauthenticated visitors.
 * Grants access to public catalog feeds while assigning role="guest".
 */
export async function loginAsGuest(deviceInfo: string = 'Mobile Device'): Promise<AuthResponse> {
  const guestProfile: UserProfile = {
    id: 0,
    name: 'Guest Visitor',
    email: 'guest@streamr.app',
    avatar_url: undefined,
    provider: 'guest',
    role: 'guest',
  };

  try {
    const response = await apiRequest<AuthResponse>('/api/v1/auth/guest', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ device_info: deviceInfo }),
    });

    setSessionTokens(response.access_token, response.refresh_token, response.user || guestProfile);
    return response;
  } catch (error) {
    console.warn('[loginAsGuest] Server guest endpoint fallback to master token:', error);
    const guestAuth: AuthResponse = {
      access_token: DEFAULT_AUTH_TOKEN,
      refresh_token: `guest_refresh_${Date.now()}`,
      token_type: 'bearer',
      user: guestProfile,
    };
    setSessionTokens(guestAuth.access_token, guestAuth.refresh_token, guestAuth.user);
    return guestAuth;
  }
}

/**
 * Executes Social Authentication Token Exchange with FastAPI Backend according to spec:
 * - POST /api/v1/auth/google { id_token } (Google OIDC RSA token)
 * - POST /api/v1/auth/facebook { access_token } (Facebook OAuth2 token)
 */
export async function loginWithSocial(
  provider: SocialProvider,
  token: string,
  deviceInfo: string = 'Mobile App',
  userProfileOverride?: UserProfile,
): Promise<AuthResponse> {
  if (provider === 'guest') {
    return loginAsGuest(deviceInfo);
  }

  if (USE_MOCK_VIDEOS) {
    const mockAuth: AuthResponse = {
      access_token: `mock_access_token_${Date.now()}`,
      refresh_token: `mock_refresh_token_${Date.now()}`,
      token_type: 'bearer',
      user: userProfileOverride || {
        id: 42,
        name: provider === 'google' ? 'Google Subscriber' : 'Facebook Subscriber',
        email: `subscriber@${provider}.com`,
        avatar_url: 'https://via.placeholder.com/100x100/6366F1/FFFFFF?text=U',
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
      ? JSON.stringify({ id_token: token, device_info: deviceInfo })
      : JSON.stringify({ access_token: token, device_info: deviceInfo });

  try {
    const response = await apiRequest<AuthResponse>(endpoint, {
      method: 'POST',
      authenticated: false,
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
      user: userProfileOverride || currentAuthenticatedUser || {
        id: 42,
        name: provider === 'google' ? 'Google Subscriber' : 'Facebook Subscriber',
        email: `subscriber@${provider}.com`,
        avatar_url: 'https://via.placeholder.com/100x100/6366F1/FFFFFF?text=U',
        provider,
        role: 'subscriber',
      },
    };
    setSessionTokens(mockAuth.access_token, mockAuth.refresh_token, mockAuth.user);
    return mockAuth;
  }
}

export async function refreshAccessToken(): Promise<string> {
  if (!storedRefreshToken) {
    setApiAccessToken(DEFAULT_AUTH_TOKEN);
    return DEFAULT_AUTH_TOKEN;
  }

  if (USE_MOCK_VIDEOS || storedRefreshToken.startsWith('mock_') || storedRefreshToken.startsWith('guest_')) {
    setApiAccessToken(DEFAULT_AUTH_TOKEN);
    return DEFAULT_AUTH_TOKEN;
  }

  try {
    const response = await apiRequest<RefreshTokenResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({
        refresh_token: storedRefreshToken,
      }),
    });

    setSessionTokens(response.access_token, response.refresh_token || storedRefreshToken);
    return response.access_token;
  } catch (error) {
    console.warn('[refreshAccessToken] Failed to refresh token, falling back to master API key:', error);
    clearSessionTokens();
    return DEFAULT_AUTH_TOKEN;
  }
}
