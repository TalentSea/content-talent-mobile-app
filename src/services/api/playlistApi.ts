import { apiGet, apiRequest } from './client';
import { getCreatorId, API_BASE_PATH } from '../../constants/config';
import type { ApiVideo } from '../../types/video';

export type PlaylistListItem = {
  id: number;
  name: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_count?: number;
  created_at?: string | null;
};

export type PlaylistDetails = PlaylistListItem & {
  videos?: {
    total?: number;
    page?: number;
    limit?: number;
    total_pages?: number;
    items?: ApiVideo[];
  } | ApiVideo[];
};

export type PaginatedPlaylistsResponse = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: PlaylistListItem[];
};

export type PaginatedPlaylistVideosResponse = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: ApiVideo[];
};

export function normalizePlaylist(item: any): PlaylistListItem {
  if (!item) return item;
  return {
    id: item.id,
    name: item.name || '',
    description: item.description || null,
    thumbnail_url: item.thumbnail_url || null,
    video_count: typeof item.video_count === 'number'
      ? item.video_count
      : (Array.isArray(item.videos?.items) ? item.videos.items.length : (Array.isArray(item.videos) ? item.videos.length : 0)),
    created_at: item.created_at || null,
  };
}

export async function fetchPlaylists(
  search?: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedPlaylistsResponse> {
  try {
    const query = new URLSearchParams();

    if (search) query.set('search', search);
    query.set('page', String(page));
    query.set('limit', String(limit));

    // GET /api/v1/mobile/playlists — List Public Playlists Feed
    const response = await apiGet<any>(
      `${API_BASE_PATH}/playlists?${query.toString()}`,
    );
    if (response) {
      let items: PlaylistListItem[] = [];
      if (Array.isArray(response.items)) {
        items = response.items;
      } else if (Array.isArray(response)) {
        items = response;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      }
      return {
        total: response.total ?? items.length,
        page: response.page ?? page,
        limit: response.limit ?? limit,
        total_pages: response.total_pages ?? 1,
        items: items.map(normalizePlaylist),
      };
    }

    return { total: 0, page: 1, limit: limit, total_pages: 1, items: [] };
  } catch (error) {
    console.warn('[fetchPlaylists] Mobile API notice:', error);
    return { total: 0, page: 1, limit: limit, total_pages: 1, items: [] };
  }
}

export async function fetchPlaylistDetails(
  playlistId: number,
): Promise<PlaylistDetails> {
  try {
    // GET /api/v1/mobile/playlists/{playlist_id} — Get Playlist Details & Video Feed
    const response = await apiGet<any>(`${API_BASE_PATH}/playlists/${playlistId}`);
    if (response) {
      const details = response.data || response;
      return {
        ...normalizePlaylist(details),
        videos: details.videos,
      } as PlaylistDetails;
    }
    throw new Error('No playlist details returned');
  } catch (error) {
    console.warn(`[fetchPlaylistDetails] Mobile API notice for playlist ${playlistId}:`, error);
    throw error;
  }
}

export async function fetchPlaylistVideos(
  playlistId: number,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedPlaylistVideosResponse> {
  try {
    const query = new URLSearchParams();

    query.set('page', String(page));
    query.set('limit', String(limit));

    // GET /api/v1/mobile/playlists/{playlist_id}/videos
    const response = await apiGet<any>(
      `${API_BASE_PATH}/playlists/${playlistId}/videos?${query.toString()}`,
    );

    if (response) {
      let items: ApiVideo[] = [];
      if (Array.isArray(response.items)) {
        items = response.items;
      } else if (Array.isArray(response.videos?.items)) {
        items = response.videos.items;
      } else if (Array.isArray(response)) {
        items = response;
      } else if (Array.isArray(response.videos)) {
        items = response.videos;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      }
      return {
        total: response.total ?? items.length,
        page: response.page ?? page,
        limit: response.limit ?? limit,
        total_pages: response.total_pages ?? 1,
        items,
      };
    }

    return { total: 0, page: 1, limit: limit, total_pages: 1, items: [] };
  } catch (error) {
    console.warn(`[fetchPlaylistVideos] Mobile API notice for playlist ${playlistId}:`, error);
    return { total: 0, page: 1, limit: limit, total_pages: 1, items: [] };
  }
}

/**
 * POST /api/v1/mobile/playlists/{playlist_id}/save — Toggle Playlist Bookmark
 * Toggles bookmark/save state (save / unsave) for an authenticated subscriber on a public creator playlist.
 */
export async function toggleSavePlaylistApi(playlistId: number): Promise<{ is_saved: boolean }> {
  try {
    const response = await apiRequest<{ is_saved: boolean }>(
      `${API_BASE_PATH}/playlists/${playlistId}/save`,
      {
        method: 'POST',
        authenticated: true,
      },
    );
    return response;
  } catch (error) {
    console.warn(`[toggleSavePlaylistApi] Error toggling bookmark for playlist ${playlistId}:`, error);
    throw error;
  }
}

/**
 * GET /api/v1/mobile/playlists/saved — List Subscriber Saved Playlists
 * Retrieves a paginated list of creator playlists bookmarked/saved by the authenticated subscriber.
 */
export async function fetchSavedPlaylistsApi(
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedPlaylistsResponse> {
  try {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));

    const response = await apiRequest<any>(
      `${API_BASE_PATH}/playlists/saved?${query.toString()}`,
      {
        method: 'GET',
        authenticated: true,
      },
    );

    if (response) {
      let items: PlaylistListItem[] = [];
      if (Array.isArray(response.items)) {
        items = response.items;
      } else if (Array.isArray(response)) {
        items = response;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      }
      return {
        total: response.total ?? items.length,
        page: response.page ?? page,
        limit: response.limit ?? limit,
        total_pages: response.total_pages ?? 1,
        items: items.map(normalizePlaylist),
      };
    }

    return { total: 0, page: 1, limit: limit, total_pages: 1, items: [] };
  } catch (error) {
    console.warn('[fetchSavedPlaylistsApi] Error listing saved playlists:', error);
    return { total: 0, page: 1, limit: limit, total_pages: 1, items: [] };
  }
}

