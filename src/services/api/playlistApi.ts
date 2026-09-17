import { apiGet } from './client';
import { getCreatorId } from '../../constants/config';
import type { ApiVideo } from '../../types/video';

export type PlaylistListItem = {
  id: number;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  video_count: number;
  created_at: string | null;
};

export type PaginatedPlaylistsResponse = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: PlaylistListItem[];
};

export type PlaylistDetails = PlaylistListItem & {
  videos?: ApiVideo[];
};

export type PaginatedPlaylistVideosResponse = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: ApiVideo[];
};

export async function fetchPlaylists(
  search?: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedPlaylistsResponse> {
  try {
    const query = new URLSearchParams();
    const cid = getCreatorId();
    if (cid) query.set('creator_id', String(cid));
    if (search) query.set('search', search);
    query.set('page', String(page));
    query.set('limit', String(limit));

    // Mobile Playlists Endpoint (/api/v1/mobile/playlists)
    const response = await apiGet<any>(
      `/api/v1/mobile/playlists?${query.toString()}`,
    );
    if (response) {
      let items: PlaylistListItem[] = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (Array.isArray(response.items)) {
        items = response.items;
      } else if (Array.isArray(response.playlists)) {
        items = response.playlists;
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
    console.warn('[fetchPlaylists] Mobile API notice:', error);
    return { total: 0, page: 1, limit: limit, total_pages: 1, items: [] };
  }
}

export async function fetchPlaylistDetails(
  playlistId: number,
): Promise<PlaylistDetails> {
  try {
    const cid = getCreatorId();
    // Mobile Playlist Details API (/api/v1/mobile/playlists/{id})
    const response = await apiGet<any>(`/api/v1/mobile/playlists/${playlistId}?creator_id=${cid}`);
    if (response) {
      const details = response.data || response;
      return details;
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
    const cid = getCreatorId();
    if (cid) query.set('creator_id', String(cid));
    query.set('page', String(page));
    query.set('limit', String(limit));

    // Mobile Playlist Videos API (/api/v1/mobile/playlists/{id}/videos)
    const response = await apiGet<any>(
      `/api/v1/mobile/playlists/${playlistId}/videos?${query.toString()}`,
    );

    if (response) {
      let items: ApiVideo[] = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (Array.isArray(response.items)) {
        items = response.items;
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
