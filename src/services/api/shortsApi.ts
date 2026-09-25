import { apiGet, apiRequest, getApiAccessToken } from './client';
import { loginAsGuest } from './authService';

export type ShortCaptionItem = {
  language?: string;
  srclang: string;
  url: string;
};

export type ShortItem = {
  id: number;
  title: string;
  description?: string | null;
  streamUrl: string;
  thumbnailUrl?: string | null;
  duration?: number;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  captions?: ShortCaptionItem[];
  creatorName?: string;
  creatorAvatar?: string | null;
  publishedAt?: string | null;
};

export type PaginatedShortsResponse = {
  items: ShortItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

/**
 * GET /api/v1/mobile/videos/shorts — Vertical Short Videos (Reels / Shorts) Swipe Feed
 * Directly bundles presigned adaptive HLS streams (hls_stream_url) for 0ms swipe playback.
 */
export async function fetchShortsApi(
  page: number = 1,
  limit: number = 10,
  sort: 'newest' | 'popular' | 'most_liked' = 'newest'
): Promise<ShortItem[]> {
  // Ensure we have a valid auth token (guest or user) since endpoint requires authentication
  if (!getApiAccessToken()) {
    try {
      await loginAsGuest();
    } catch (authErr) {
      console.warn('[fetchShortsApi] Guest session bootstrap notice:', authErr);
    }
  }

  const endpoints = [
    `/api/v1/mobile/videos/shorts?page=${page}&limit=${limit}&sort=${sort}`,
    `/api/v1/mobile/shorts?page=${page}&limit=${limit}&sort=${sort}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await apiGet<any>(endpoint);
      const items = Array.isArray(response)
        ? response
        : response?.items || response?.data || response?.shorts;

      if (Array.isArray(items)) {
        return items.map((item: any, idx: number): ShortItem => ({
          id: Number(item.id || idx + 1),
          title: item.title || 'Short Video',
          description: item.description || item.caption || null,
          streamUrl:
            item.hls_stream_url ||
            item.video_url ||
            item.stream_url ||
            item.playback_url ||
            '',
          thumbnailUrl: item.thumbnail_url || item.thumbnail || item.poster || null,
          duration: Number(item.duration || 0),
          viewsCount: Number(item.views_count ?? item.views ?? 0),
          likesCount: Number(item.likes_count ?? item.likes ?? 0),
          commentsCount: Number(item.comments_count ?? item.comments ?? 0),
          isLiked: Boolean(item.is_liked || item.liked),
          isSaved: Boolean(item.is_saved || item.saved),
          captions: Array.isArray(item.captions) ? item.captions : [],
          creatorName: item.creator?.name || item.creator_name || 'Creator',
          creatorAvatar: item.creator?.logo_url || item.creator_avatar || null,
          publishedAt: item.published_at || null,
        }));
      }
    } catch (error) {
      console.warn(`[fetchShortsApi] Endpoint ${endpoint} notice:`, error);
    }
  }

  // Return empty list when no backend items are available — no mock data
  return [];
}

/**
 * POST /api/v1/mobile/videos/{id}/like — Toggle Short Video Like
 */
export async function toggleShortLikeApi(
  shortId: number
): Promise<{ is_liked: boolean; likes_count?: number } | null> {
  if (!getApiAccessToken()) {
    try {
      await loginAsGuest();
    } catch (authErr) {
      console.warn('[toggleShortLikeApi] Guest session bootstrap notice:', authErr);
    }
  }

  const endpoints = [
    `/api/v1/mobile/videos/${shortId}/like`,
    `/api/v1/mobile/shorts/${shortId}/like`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await apiRequest<{ is_liked?: boolean; likes_count?: number; status?: string }>(ep, {
        method: 'POST',
      });
      return {
        is_liked: Boolean(res?.is_liked),
        likes_count: typeof res?.likes_count === 'number' ? res.likes_count : undefined,
      };
    } catch (err) {
      console.warn(`[toggleShortLikeApi] Like notice on ${ep}:`, err);
    }
  }

  return null;
}

/**
 * POST /api/v1/mobile/videos/{id}/save — Toggle Short Video Bookmark / Save
 */
export async function toggleShortSaveApi(
  shortId: number
): Promise<{ is_saved: boolean } | null> {
  if (!getApiAccessToken()) {
    try {
      await loginAsGuest();
    } catch (authErr) {
      console.warn('[toggleShortSaveApi] Guest session bootstrap notice:', authErr);
    }
  }

  try {
    const res = await apiRequest<{ is_saved?: boolean }>(
      `/api/v1/mobile/videos/${shortId}/save`,
      { method: 'POST' }
    );
    return { is_saved: Boolean(res?.is_saved) };
  } catch (err) {
    console.warn(`[toggleShortSaveApi] Save notice for short ${shortId}:`, err);
    return null;
  }
}

/**
 * POST /api/v1/mobile/videos/{id}/share — Record Short Video Share Event
 */
export async function recordShortShareApi(
  shortId: number
): Promise<{ status: string; share_count?: number } | null> {
  if (!getApiAccessToken()) {
    try {
      await loginAsGuest();
    } catch (authErr) {
      console.warn('[recordShortShareApi] Guest session bootstrap notice:', authErr);
    }
  }

  const endpoints = [
    `/api/v1/mobile/videos/${shortId}/share`,
    `/api/v1/mobile/shorts/${shortId}/share`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await apiRequest<{ status?: string; share_count?: number }>(ep, {
        method: 'POST',
      });
      return {
        status: res?.status || 'success',
        share_count: res?.share_count,
      };
    } catch (err) {
      // Endpoint fallback
    }
  }

  return null;
}

/**
 * POST /api/v1/mobile/videos/{id}/progress — Record Short Watch Progress Heartbeat
 */
export async function recordShortProgressApi(
  shortId: number,
  progressSeconds: number
): Promise<void> {
  try {
    await apiRequest(`/api/v1/mobile/videos/${shortId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ progress_seconds: Math.floor(progressSeconds) }),
    });
  } catch (err) {
    // Silent telemetry notice
  }
}

/**
 * POST /api/v1/mobile/videos/{id}/views — Increment Verified View Count
 */
export async function recordShortViewApi(
  shortId: number
): Promise<{ views_count?: number } | null> {
  try {
    const res = await apiRequest<{ status?: string; views_count?: number }>(
      `/api/v1/mobile/videos/${shortId}/views`,
      { method: 'POST' }
    );
    return res;
  } catch (err) {
    return null;
  }
}
