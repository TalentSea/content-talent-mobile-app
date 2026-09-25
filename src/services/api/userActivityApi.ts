import { apiGet, apiRequest } from './client';
import type { PaginatedVideosResponse } from '../../types/video';
import { normalizeVideoItem } from './video';
=======
import { getCreatorId , API_BASE_PATH } from '../../constants/config';
>>>>>>> f8b26fa1 (refactor mobile API paths)

export type UserHistoryResponseItem = {
  video_id: number;
  progress_percentage: number;
  last_position_seconds: number;
};

<<<<<<< HEAD
export type MobileCategoryItem = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  icon?: string;
  color?: string;
  contentCount?: number;
  video_count?: number;
};
    if (!response || !response.items) {
      return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
    }
    return {
      total: response.total ?? items.length,
      page: response.page ?? 1,
      limit: response.limit ?? 20,
      total_pages: response.total_pages ?? 1,
      items: items.map(normalizeVideoItem),
    };
  } catch (error) {
    console.warn('[fetchUserWatchHistoryApi] Mobile API notice:', error);
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }
}

export async function fetchUserContinueWatchingApi(): Promise<PaginatedVideosResponse> {
  try {
    // Exclusive Mobile Endpoint: GET /api/v1/mobile/videos/continue-watching
    const response = await apiGet<any>(`${API_BASE_PATH}/videos/continue-watching`);
    let items: any[] = [];
    if (response) {
      if (Array.isArray(response.items)) items = response.items;
      else if (Array.isArray(response.data)) items = response.data;
      else if (Array.isArray(response)) items = response;
    }
    
    if (items.length === 0) {
      return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
    }
    return {
      total: response.total ?? items.length,
      page: response.page ?? 1,
      limit: response.limit ?? 20,
      total_pages: response.total_pages ?? 1,
      items: items.map(normalizeVideoItem),
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
  const roundSeconds = Math.round(lastPositionSeconds);

  try {
    // Mobile Video API Spec #9: POST /api/v1/mobile/videos/{video_id}/progress
    // Body: { "progress_seconds": <number> } -> Response: 204 No Content
    await apiRequest(`${API_BASE_PATH}/videos/${videoId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress_seconds: roundSeconds }),
    });
  } catch (error) {
    console.warn(`[recordUserWatchHistoryApi] Progress sync notice for video ${videoId}:`, error);
  }
}

export type ActionStatusResponse = {
  status: 'success' | 'error' | string;
};

export async function clearUserWatchHistoryApi(): Promise<ActionStatusResponse> {
  try {
    // Exclusive Mobile Endpoint: DELETE /api/v1/mobile/videos/history
    const res = await apiRequest<ActionStatusResponse>(`${API_BASE_PATH}/videos/history`, { method: 'DELETE' });
    return { status: res?.status || 'success' };
  } catch (error) {
    console.warn('[clearUserWatchHistoryApi] Mobile API notice:', error);
    return { status: 'error' };
  }
}

export async function removeVideoWatchHistoryApi(videoId: number): Promise<ActionStatusResponse> {
  try {
    // Exclusive Mobile Endpoint: DELETE /api/v1/mobile/videos/history/{video_id}
    const res = await apiRequest<ActionStatusResponse>(`${API_BASE_PATH}/videos/history/${videoId}`, { method: 'DELETE' });
    return { status: res?.status || 'success' };
  } catch (error) {
    console.warn(`[removeVideoWatchHistoryApi] Mobile API notice for video ${videoId}:`, error);
    return { status: 'error' };
  }
}

export async function fetchUserLikedVideosApi(): Promise<PaginatedVideosResponse> {
  try {
    // Exclusive Mobile Endpoint: GET /api/v1/mobile/videos/liked
    const response = await apiGet<any>(`${API_BASE_PATH}/videos/liked`);
    let items: any[] = [];
    if (response) {
      if (Array.isArray(response.items)) items = response.items;
      else if (Array.isArray(response.data)) items = response.data;
      else if (Array.isArray(response)) items = response;
    }
    
    if (items.length === 0) {
      return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
    }
    return {
      total: response.total ?? items.length,
      page: response.page ?? 1,
      limit: response.limit ?? 20,
      total_pages: response.total_pages ?? 1,
      items: items.map(normalizeVideoItem),
    };
  } catch (error) {
    console.warn('[fetchUserLikedVideosApi] Mobile API notice:', error);
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }
}

export async function toggleUserLikedVideoApi(videoId: number, isLiked: boolean = true) {
  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/like
    await apiRequest(`${API_BASE_PATH}/videos/${videoId}/like`, { method: 'POST' });
  } catch (error) {
    console.warn(`[toggleUserLikedVideoApi] Mobile API notice for video ${videoId}:`, error);
  }
}

export async function fetchUserSavedVideosApi(): Promise<PaginatedVideosResponse> {
  try {
    // Exclusive Mobile Endpoint: GET /api/v1/mobile/videos/saved
    const response = await apiGet<any>(`${API_BASE_PATH}/videos/saved`);
    let items: any[] = [];
    if (response) {
      if (Array.isArray(response.items)) items = response.items;
      else if (Array.isArray(response.data)) items = response.data;
      else if (Array.isArray(response)) items = response;
    }
    
    if (items.length === 0) {
      return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
    }
    return {
      total: response.total ?? items.length,
      page: response.page ?? 1,
      limit: response.limit ?? 20,
      total_pages: response.total_pages ?? 1,
      items: items.map(normalizeVideoItem),
    };
  } catch (error) {
    console.warn('[fetchUserSavedVideosApi] Mobile API notice:', error);
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }
}

export async function toggleUserSavedVideoApi(videoId: number) {
  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/save
    await apiRequest(`${API_BASE_PATH}/videos/${videoId}/save`, { method: 'POST' });
  } catch (error) {
    console.warn(`[toggleUserSavedVideoApi] Mobile API notice for video ${videoId}:`, error);
  }
}

export async function incrementVideoViewsApi(videoId: number) {
  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/views
    await apiRequest(`${API_BASE_PATH}/videos/${videoId}/views`, { method: 'POST' });
  } catch (error) {
    console.warn(`[incrementVideoViewsApi] Mobile API notice for video ${videoId}:`, error);
  }
}

export async function recordAdImpressionApi(
  videoId: number,
  eventType: 'impression' | 'midpoint' | 'complete' = 'impression',
  adDurationSeconds: number = 15,
) {
  try {
    // Mobile Video API Spec #13: POST /api/v1/mobile/videos/{video_id}/ad-impression
    await apiRequest(`${API_BASE_PATH}/videos/${videoId}/ad-impression`, {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        ad_duration_seconds: adDurationSeconds,
      }),
    });
  } catch (error) {
    console.warn(`[recordAdImpressionApi] Telemetry notice for video ${videoId}:`, error);
  }
}


export async function fetchUserCategoriesApi(): Promise<MobileCategoryItem[]> {
  // Consumer app category list is available at GET /api/v1/categories. It delivers active, published categories sorted by display order.
  const endpoints = [
    `${API_BASE_PATH}/categories`,
    `${API_BASE_PATH}/categories`,
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
          description: item.description || item.subtitle || item.desc || null,
          thumbnailUrl: item.thumbnailUrl || item.thumbnail_url || item.thumbnail || item.image_url || item.image || item.poster_url || item.poster || null,
          color: item.color,
          icon: item.icon,
          contentCount: item.contentCount ?? item.content_count ?? item.video_count ?? item.videos_count ?? item.count ?? item.total_videos ?? undefined,
          video_count: item.contentCount ?? item.content_count ?? item.video_count ?? item.videos_count ?? item.count ?? item.total_videos ?? undefined,
        }));
      }
    } catch (error) {
      console.warn(`[fetchUserCategoriesApi] Endpoint ${path} notice:`, error);
    }
  }

  return [];
}

