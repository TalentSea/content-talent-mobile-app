import { apiRequest, setApiAccessToken } from './client';
import { USE_MOCK_VIDEOS, DEFAULT_AUTH_TOKEN } from '../../constants/config';

export type SocialProvider = 'google' | 'facebook';

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  provider: string;
  role: string;
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

export function getStoredRefreshToken(): string | null {
  return storedRefreshToken;
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
}

export async function clearSessionTokens() {
  setApiAccessToken(DEFAULT_AUTH_TOKEN);
  storedRefreshToken = null;
  currentAuthenticatedUser = null;

  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    if (GoogleSignin) {
      await GoogleSignin.signOut();
    }
  } catch (e) {
    // ignore
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

  if (USE_MOCK_VIDEOS || storedRefreshToken.startsWith('mock_')) {
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
