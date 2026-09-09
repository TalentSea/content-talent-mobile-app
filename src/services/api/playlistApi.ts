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

    // 1. Primary: Mobile Playlists Endpoint (/api/v1/mobile/playlists)
    try {
      const response = await apiGet<PaginatedPlaylistsResponse>(
        `/api/v1/mobile/playlists?${query.toString()}`,
      );
      if (response && Array.isArray(response.items)) {
        return response;
      }
    } catch (err) {
      // Mobile playlists fallback
    }

    // 2. Admin Playlists Endpoint (/api/v1/admin/playlists)
    try {
      const adminResponse = await apiGet<PaginatedPlaylistsResponse>(
        `/api/v1/admin/playlists?${query.toString()}`,
      );
      if (adminResponse && Array.isArray(adminResponse.items) && adminResponse.items.length > 0) {
        return adminResponse;
      }
    } catch (e) {
      // Admin playlists fallback
    }

    // 3. Public Playlists Endpoint (/api/v1/playlists)
    const publicResponse = await apiGet<PaginatedPlaylistsResponse>(
      `/api/v1/playlists?${query.toString()}`,
    );
    if (publicResponse && Array.isArray(publicResponse.items)) {
      return publicResponse;
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
    // 1. Primary: Mobile Playlist Details API
    try {
      return await apiGet<PlaylistDetails>(`/api/v1/mobile/playlists/${playlistId}`);
    } catch (e) {
      // Fallback
    }

    // 2. Admin Playlist Details API
    try {
      return await apiGet<PlaylistDetails>(`/api/v1/admin/playlists/${playlistId}`);
    } catch (e) {
      // Fallback
    }

    // 3. Public Playlist Details API
    return await apiGet<PlaylistDetails>(`/api/v1/playlists/${playlistId}`);
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

    // 1. Primary: Mobile Playlist Videos API
    try {
      const response = await apiGet<PaginatedPlaylistVideosResponse>(
        `/api/v1/mobile/playlists/${playlistId}/videos?${query.toString()}`,
      );
      if (response && Array.isArray(response.items) && response.items.length > 0) {
        return response;
      }
    } catch (e) {
      // Fallback
    }

    // 2. Admin Playlist Videos API
    try {
      const adminResponse = await apiGet<PaginatedPlaylistVideosResponse>(
        `/api/v1/admin/playlists/${playlistId}/videos?${query.toString()}`,
      );
      if (adminResponse && Array.isArray(adminResponse.items) && adminResponse.items.length > 0) {
        return adminResponse;
      }
    } catch (e) {
      // Fallback
    }

    // 3. Public Playlist Videos API
    const publicResponse = await apiGet<PaginatedPlaylistVideosResponse>(
      `/api/v1/playlists/${playlistId}/videos?${query.toString()}`,
    );
    if (publicResponse && Array.isArray(publicResponse.items)) {
      return publicResponse;
    }
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
