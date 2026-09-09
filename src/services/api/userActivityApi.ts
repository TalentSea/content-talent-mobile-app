import { apiGet, apiRequest } from './client';
import type { PaginatedVideosResponse } from '../../types/video';
import { incrementMockVideoViews, toggleMockVideoLike } from './mockVideoApi';
import { normalizeVideoItem } from './video';

export type UserHistoryResponseItem = {
  video_id: number;
  progress_percentage: number;
  last_position_seconds: number;
};

export type MobileCategoryItem = {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
};

export type MobileCategoriesResponse = {
  data: MobileCategoryItem[];
};

export async function fetchUserWatchHistoryApi(): Promise<PaginatedVideosResponse> {
  try {
    // Exclusive Mobile Endpoint: GET /api/v1/mobile/videos/history
    const response = await apiGet<PaginatedVideosResponse>('/api/v1/mobile/videos/history');
    if (!response || !response.items) {
      return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
    }
    return {
      ...response,
      items: response.items.map(normalizeVideoItem),
    };
  } catch (error) {
    console.warn('[fetchUserWatchHistoryApi] Mobile API notice:', error);
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }
}

export async function fetchUserContinueWatchingApi(): Promise<PaginatedVideosResponse> {
  try {
    // Exclusive Mobile Endpoint: GET /api/v1/mobile/videos/continue-watching
    const response = await apiGet<PaginatedVideosResponse>('/api/v1/mobile/videos/continue-watching');
    if (!response || !response.items) {
      return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
    }
    return {
      ...response,
      items: response.items.map(normalizeVideoItem),
    };
  } catch (error) {
    console.warn('[fetchUserContinueWatchingApi] Mobile API notice:', error);
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }
}

export async function recordUserWatchHistoryApi(
  videoId: number,
  progressPercentage: number = 10,
  lastPositionSeconds: number = 0,
) {
  const roundProgress = Math.round(progressPercentage);
  const roundSeconds = Math.round(lastPositionSeconds);

  const payload = {
    video_id: videoId,
    progress_percentage: roundProgress,
    progress_seconds: roundSeconds,
    last_position_seconds: roundSeconds,
    watch_progress: roundProgress,
  };

  const candidateEndpoints = [
    { path: `/api/v1/mobile/videos/${videoId}/progress`, method: 'POST' },
    { path: `/api/v1/videos/${videoId}/progress`, method: 'POST' },
    { path: `/api/v1/mobile/videos/${videoId}/progress?progress_percentage=${roundProgress}&last_position_seconds=${roundSeconds}`, method: 'POST' },
    { path: `/api/v1/mobile/videos/${videoId}/progress`, method: 'PUT' },
  ];

  for (const ep of candidateEndpoints) {
    try {
      await apiRequest(ep.path, {
        method: ep.method,
        body: JSON.stringify(payload),
      });
      return;
    } catch (error) {
      // Continue trying next candidate endpoint fallback silently
    }
  }
}

export async function clearUserWatchHistoryApi() {
  try {
    // Exclusive Mobile Endpoint: DELETE /api/v1/mobile/videos/history
    await apiRequest('/api/v1/mobile/videos/history', { method: 'DELETE' });
  } catch (error) {
    console.warn('[clearUserWatchHistoryApi] Mobile API notice:', error);
  }
}

export async function removeVideoWatchHistoryApi(videoId: number) {
  try {
    // Exclusive Mobile Endpoint: DELETE /api/v1/mobile/videos/history/{video_id}
    await apiRequest(`/api/v1/mobile/videos/history/${videoId}`, { method: 'DELETE' });
  } catch (error) {
    console.warn(`[removeVideoWatchHistoryApi] Mobile API notice for video ${videoId}:`, error);
  }
}

export async function fetchUserLikedVideosApi(): Promise<PaginatedVideosResponse> {
  try {
    // Exclusive Mobile Endpoint: GET /api/v1/mobile/videos/liked
    const response = await apiGet<PaginatedVideosResponse>('/api/v1/mobile/videos/liked');
    if (!response || !response.items) {
      return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
    }
    return {
      ...response,
      items: response.items.map(normalizeVideoItem),
    };
  } catch (error) {
    console.warn('[fetchUserLikedVideosApi] Mobile API notice:', error);
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }
}

export async function toggleUserLikedVideoApi(videoId: number, isLiked: boolean = true) {
  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/like
    await apiRequest(`/api/v1/mobile/videos/${videoId}/like`, { method: 'POST' });
  } catch (error) {
    console.warn(`[toggleUserLikedVideoApi] Mobile API notice for video ${videoId}:`, error);
  }
}

export async function fetchUserSavedVideosApi(): Promise<PaginatedVideosResponse> {
  try {
    // Exclusive Mobile Endpoint: GET /api/v1/mobile/videos/saved
    const response = await apiGet<PaginatedVideosResponse>('/api/v1/mobile/videos/saved');
    if (!response || !response.items) {
      return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
    }
    return {
      ...response,
      items: response.items.map(normalizeVideoItem),
    };
  } catch (error) {
    console.warn('[fetchUserSavedVideosApi] Mobile API notice:', error);
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }
}

export async function toggleUserSavedVideoApi(videoId: number) {
  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/save
    await apiRequest(`/api/v1/mobile/videos/${videoId}/save`, { method: 'POST' });
  } catch (error) {
    console.warn(`[toggleUserSavedVideoApi] Mobile API notice for video ${videoId}:`, error);
  }
}

export async function incrementVideoViewsApi(videoId: number) {
  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/views
    await apiRequest(`/api/v1/mobile/videos/${videoId}/views`, { method: 'POST' });
  } catch (error) {
    console.warn(`[incrementVideoViewsApi] Mobile API notice for video ${videoId}:`, error);
  }
}

export async function fetchUserCategoriesApi(): Promise<MobileCategoryItem[]> {
  const endpoints = [
    '/api/v1/mobile/categories',
  ];

  for (const path of endpoints) {
    try {
      const response = await apiGet<any>(path);
      const list = Array.isArray(response)
        ? response
        : response?.data || response?.items || response?.categories;

      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any, idx: number) => ({
          id: item.id || idx + 1,
          name: item.name || item.title || item.category_name || 'Category',
          slug: item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : `cat_${idx}`),
          color: item.color,
          icon: item.icon,
        }));
      }
    } catch (error) {
      console.warn(`[fetchUserCategoriesApi] Endpoint ${path} notice:`, error);
    }
  }

  return [];
}
