import { apiGet } from './client';
import { USE_MOCK_VIDEOS } from '../../constants/config';
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

const MOCK_PLAYLISTS: PlaylistListItem[] = [
  {
    id: 1,
    name: 'Favorites & Liked Videos',
    description: 'User curated favorite tech streams',
    thumbnail_url: 'https://via.placeholder.com/400x200/1E1E2E/FFFFFF?text=Favorites',
    video_count: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'React Native & Mobile Dev',
    description: 'Comprehensive mobile development tutorials',
    thumbnail_url: 'https://via.placeholder.com/400x200/2A1E38/FFFFFF?text=Mobile+Dev',
    video_count: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'FastAPI Backend Architecture',
    description: 'REST API, SQLite, and Peewee ORM masterclass',
    thumbnail_url: 'https://via.placeholder.com/400x200/1E2E38/FFFFFF?text=Backend+Mastery',
    video_count: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: '4' as any,
    name: 'Watch Later',
    description: 'Saved streams to watch later',
    thumbnail_url: 'https://via.placeholder.com/400x200/381E2E/FFFFFF?text=Watch+Later',
    video_count: 15,
    created_at: new Date().toISOString(),
  },
];

export async function fetchPlaylists(
  search?: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedPlaylistsResponse> {
  if (USE_MOCK_VIDEOS) {
    return {
      total: MOCK_PLAYLISTS.length,
      page: 1,
      limit: 20,
      total_pages: 1,
      items: MOCK_PLAYLISTS,
    };
  }

  try {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    query.set('page', String(page));
    query.set('limit', String(limit));

    return await apiGet<PaginatedPlaylistsResponse>(
      `/api/v1/admin/playlists?${query.toString()}`,
    );
  } catch (error) {
    console.warn('[fetchPlaylists] Real API error, using mock playlists fallback:', error);
    return {
      total: MOCK_PLAYLISTS.length,
      page: 1,
      limit: 20,
      total_pages: 1,
      items: MOCK_PLAYLISTS,
    };
  }
}

export async function fetchPlaylistDetails(
  playlistId: number,
): Promise<PlaylistDetails> {
  if (USE_MOCK_VIDEOS) {
    const mock = MOCK_PLAYLISTS.find(p => p.id === playlistId) || MOCK_PLAYLISTS[0];
    return mock;
  }

  try {
    return await apiGet<PlaylistDetails>(
      `/api/v1/admin/playlists/${playlistId}`,
    );
  } catch (error) {
    console.warn(`[fetchPlaylistDetails] API error for playlist ${playlistId}, using fallback:`, error);
    const mock = MOCK_PLAYLISTS.find(p => p.id === playlistId) || MOCK_PLAYLISTS[0];
    return mock;
  }
}

export async function fetchPlaylistVideos(
  playlistId: number,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedPlaylistVideosResponse> {
  if (USE_MOCK_VIDEOS) {
    return {
      total: 0,
      page: 1,
      limit: 20,
      total_pages: 1,
      items: [],
    };
  }

  try {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));

    return await apiGet<PaginatedPlaylistVideosResponse>(
      `/api/v1/admin/playlists/${playlistId}/videos?${query.toString()}`,
    );
  } catch (error) {
    console.warn(`[fetchPlaylistVideos] API error for playlist ${playlistId} videos, using fallback:`, error);
    return {
      total: 0,
      page: 1,
      limit: 20,
      total_pages: 1,
      items: [],
    };
  }
}
