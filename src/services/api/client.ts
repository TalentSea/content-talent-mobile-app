import { API_BASE_URL, DEFAULT_AUTH_TOKEN } from '../../constants/config';
import { refreshAccessToken } from './authService';

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
}

export function getApiAccessToken(): string | null {
  return accessToken;
}

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
  isRetry?: boolean;
};

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

  if (
    requestOptions.body &&
    !(requestOptions.body instanceof FormData) &&
    !requestHeaders.has('Content-Type')
  ) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (authenticated && accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
  });

  // Handle 401 Unauthorized -> Silent Refresh Interceptor
  if (response.status === 401 && authenticated && !isRetry && !isRefreshing) {
    try {
      isRefreshing = true;
      const newAccessToken = await refreshAccessToken();
      isRefreshing = false;

      return apiRequest<T>(path, {
        ...options,
        isRetry: true,
      });
    } catch (refreshErr) {
      isRefreshing = false;
      console.warn('[client.ts] Silent token refresh failed:', refreshErr);
    }
  }

  const responseText = await response.text();

  let responseBody: unknown;

  try {
    responseBody = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    responseBody = responseText;
  }

  if (!response.ok) {
    const detail =
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'detail' in responseBody
        ? String(responseBody.detail)
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, detail, responseBody);
  }

  return responseBody as T;
}

export function apiGet<T>(path: string) {
  return apiRequest<T>(path, { method: 'GET' });
}