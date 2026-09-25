import { API_BASE_URL, getCreatorId, setCreatorId } from '../../constants/config';
import { refreshAccessToken, loginAsGuest } from './authService';

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

let accessToken: string | null = null;
let isRefreshing = false;

export function setApiAccessToken(token: string | null) {
  accessToken = token;

  // Auto-decode JWT payload & sync active creator_id from authenticated token
  if (token) {
    const jwtCreatorId = decodeJwtCreatorId(token);
    if (jwtCreatorId && jwtCreatorId > 0) {
      setCreatorId(jwtCreatorId);
    }
  }
}

export function getApiAccessToken(): string | null {
  return accessToken;
}

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
  isRetry?: boolean;
};

export function decodeJwtCreatorId(token: string | null): number | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;

    let jsonStr = '';
    const globalAtob = (globalThis as any).atob;
    if (typeof globalAtob === 'function') {
      jsonStr = globalAtob(padded);
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      for (let i = 0; i < padded.length; i += 4) {
        const e1 = chars.indexOf(padded.charAt(i));
        const e2 = chars.indexOf(padded.charAt(i + 1));
        const e3 = chars.indexOf(padded.charAt(i + 2));
        const e4 = chars.indexOf(padded.charAt(i + 3));
        const m1 = (e1 << 2) | (e2 >> 4);
        const m2 = ((e2 & 15) << 4) | (e3 >> 2);
        const m3 = ((e3 & 3) << 6) | e4;
        jsonStr += String.fromCharCode(m1);
        if (e3 !== 64) jsonStr += String.fromCharCode(m2);
        if (e4 !== 64) jsonStr += String.fromCharCode(m3);
      }
    }
    const payload = JSON.parse(jsonStr);
    return payload?.creator_id !== undefined && payload?.creator_id !== null ? Number(payload.creator_id) : null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    isRetry = false,
    headers,
    ...requestOptions
  } = options;

  const requestHeaders = new Headers(headers);

  requestHeaders.set('Accept', 'application/json');
  requestHeaders.set('ngrok-skip-browser-warning', 'true');

  const creatorId = getCreatorId();
  if (creatorId) {
    requestHeaders.set('X-Creator-ID', String(creatorId));
  }

  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData) &&
    !requestHeaders.has('Content-Type')
  ) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let targetToken = accessToken;

  if (authenticated && targetToken) {
    requestHeaders.set('Authorization', `Bearer ${targetToken}`);
  }

  const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${cleanBaseUrl}${cleanPath}`;

  if (__DEV__) {
    console.log(`\n🔵 [API REQ] ${requestOptions.method || 'GET'} ${cleanPath}`);
    if (requestOptions.body && typeof requestOptions.body === 'string') {
      try {
        console.log('Payload:', JSON.parse(requestOptions.body));
      } catch {
        console.log('Payload:', requestOptions.body);
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...requestOptions,
      headers: requestHeaders,
    });
  } catch (error: any) {
    if (error.message === 'Network request failed' || error.message?.includes('timeout')) {
      Alert.alert('Network Error', 'No internet connection detected. Please check your network and try again.');
      throw new ApiError(0, 'Network Error', error);
    }
    throw error;
  }

  // Handle 401 Unauthorized -> Refresh access token or fall back to guest session
  if (response.status === 401 && !isRetry && !isRefreshing && !path.includes('/auth/')) {
    try {
      isRefreshing = true;
      try {
        await refreshAccessToken();
      } catch {
        await loginAsGuest();
      }
      isRefreshing = false;

      return apiRequest<T>(path, {
        ...options,
        isRetry: true,
      });
    } catch (refreshErr) {
      isRefreshing = false;
      console.warn('[client.ts] Silent token recovery failed:', refreshErr);
    }
  }

  const responseText = await response.text();

  let responseBody: unknown;

  try {
    responseBody = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    responseBody = responseText;
  }

  if (__DEV__) {
    console.log(`🟢 [API RES] ${response.status} ${cleanPath}`);
  }

  if (!response.ok) {
    const detail =
      typeof responseBody === 'object' &&
        responseBody !== null &&
        'detail' in responseBody
        ? String(responseBody.detail)
        : `Request failed with status ${response.status}`;

    // Handle basic exceptions globally
    if (response.status >= 500) {
      Alert.alert('Server Error', 'Oops! Something went wrong on our end. We are working on fixing it.');
    } else if (response.status === 404) {
      Alert.alert('Not Found', 'The data or video you are trying to load no longer exists.');
    } else if (response.status === 401 && (isRetry || path.includes(`${API_BASE_PATH}/auth/`))) {
      // Show alert if the refresh failed (isRetry) or if an auth endpoint explicitly returns 401 (e.g. invalid credentials)
      // Note: Invalid credentials might be expected, so we only alert if it's a true session expiration, but for basic flow this is fine.
      if (!path.includes('guest')) {
          Alert.alert('Authentication Error', 'Invalid session or credentials. Please try logging in again.');
      }
    }

    throw new ApiError(response.status, detail, responseBody);
  }

  return responseBody as T;
}

export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: 'GET' });
}