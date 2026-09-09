import { apiGet } from './client';
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
    if (search) query.set('search', search);
    query.set('page', String(page));
    query.set('limit', String(limit));

    // Mobile Playlists Endpoint (/api/v1/mobile/playlists)
    const response = await apiGet<PaginatedPlaylistsResponse>(
      `/api/v1/mobile/playlists?${query.toString()}`,
    );
    if (response && Array.isArray(response.items)) {
      return response;
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
    // Mobile Playlist Details API (/api/v1/mobile/playlists/{id})
    return await apiGet<PlaylistDetails>(`/api/v1/mobile/playlists/${playlistId}`);
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

    // Mobile Playlist Videos API (/api/v1/mobile/playlists/{id}/videos)
    const response = await apiGet<PaginatedPlaylistVideosResponse>(
      `/api/v1/mobile/playlists/${playlistId}/videos?${query.toString()}`,
    );
    if (response && Array.isArray(response.items)) {
      return response;
    }
  } catch (error) {
    console.warn(`[fetchPlaylistVideos] Mobile API notice for playlist ${playlistId} videos:`, error);
  }

  return {
    total: 0,
    page: 1,
    limit: limit,
    total_pages: 1,
    items: [],
  };
}
