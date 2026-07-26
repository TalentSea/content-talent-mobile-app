import { apiGet } from './client';
import type {
  ApiVideo,
  PaginatedVideosResponse,
  VideoDetails,
} from '../../../types/video';

export type FetchVideosParams = {
  search?: string;
  status?: string;
  category?: string;
  sort?: 'newest' | 'oldest' | 'views' | 'title';
  page?: number;
  limit?: number;
};

export async function fetchVideos(
  params: FetchVideosParams = {},
): Promise<PaginatedVideosResponse> {
  const query = new URLSearchParams();

  if (params.search !== undefined) {
    query.set('search', params.search);
  }

  if (params.status) {
    query.set('status', params.status);
  }

  if (params.category) {
    query.set('category', params.category);
  }

  query.set('sort', params.sort ?? 'newest');
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 50));

  return apiGet<PaginatedVideosResponse>(
    `/api/v1/admin/videos?${query.toString()}`,
  );
}

export function fetchVideoDetails(
  videoId: number,
): Promise<VideoDetails> {
  return apiGet<VideoDetails>(
    `/api/v1/admin/videos/${videoId}`,
  );
}

/**
 * Backend currently has no /play endpoint.
 * Playback URL comes from GET /api/v1/admin/videos/{id}.
 */
export async function fetchVideoPlayInfo(videoId: number) {
  const video = await fetchVideoDetails(videoId);

  if (!video.playback_url) {
    throw new Error(
      video.is_playable
        ? 'Playback URL is unavailable'
        : 'Video is not playable yet',
    );
  }

  return {
    title: video.title,
    description: video.description,
    stream_url: video.playback_url,
    poster: video.main_thumbnail_url,
    captions: [],
  };
}