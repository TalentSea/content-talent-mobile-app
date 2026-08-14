import { apiGet, apiRequest } from './client';
import type { PaginatedVideosResponse } from '../../types/video';
import { incrementMockVideoViews, toggleMockVideoLike } from './mockVideoApi';

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
    return response;
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
    return response;
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
  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/progress
    await apiRequest(`/api/v1/mobile/videos/${videoId}/progress`, {
      method: 'POST',
      body: JSON.stringify({
        progress_percentage: progressPercentage,
        progress_seconds: lastPositionSeconds,
        last_position_seconds: lastPositionSeconds,
      }),
    });
  } catch (error) {
    console.warn(`[recordUserWatchHistoryApi] Mobile API notice for video ${videoId}:`, error);
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
    return response;
  } catch (error) {
    console.warn('[fetchUserLikedVideosApi] Mobile API notice:', error);
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }
}

export async function toggleUserLikedVideoApi(videoId: number, isLiked: boolean = true) {
  toggleMockVideoLike(videoId, isLiked);
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
    return response;
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
  incrementMockVideoViews(videoId);
  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/views
    await apiRequest(`/api/v1/mobile/videos/${videoId}/views`, { method: 'POST' });
  } catch (error) {
    console.warn(`[incrementVideoViewsApi] Mobile API notice for video ${videoId}:`, error);
  }
}

export async function fetchUserCategoriesApi(): Promise<MobileCategoryItem[]> {
  try {
    // Exclusive Mobile Endpoint: GET /api/v1/mobile/categories
    const response = await apiGet<MobileCategoriesResponse>('/api/v1/mobile/categories');
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.warn('[fetchUserCategoriesApi] Mobile API notice:', error);
    return [];
  }
}
