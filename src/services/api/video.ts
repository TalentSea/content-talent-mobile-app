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

export async function fetchVideoPlayInfo(videoId: number) {
  const video = await fetchVideoDetails(videoId);

  if (!video.playback_url) {
    throw new Error(
      video.is_playable
        ? 'Playback URL is unavailable'
        : 'Video is not playable yet',
    );
  }

  const captions: import('../../../types/video').CaptionTrack[] = [];
  
  const tokenParams = video.playback_url.includes('?')
    ? video.playback_url.split('?')[1]
    : '';

  if (video.caption_url) {
    // If backend returns full URL or relative path
    const captionUri = video.caption_url.startsWith('http')
      ? video.caption_url
      : video.main_thumbnail_url
        ? video.main_thumbnail_url.replace(/thumb_[0-9]+\.(jpg|png|jpeg)(\?.*)?/, video.caption_url.replace(/^(\.\.\/)+/, ''))
        : video.caption_url;

    captions.push({
      uri: captionUri,
      language: video.caption_lang || 'en',
      label: video.caption_lang === 'es' ? 'Spanish' : 'English',
      mimeType: video.caption_url.endsWith('.srt') ? 'application/x-subrip' : 'text/vtt',
    });
  } else if (video.main_thumbnail_url) {
    // Construct VTT URL on the Pull Zone domain (talentsea77999.b-cdn.net):
    // e.g. https://talentsea77999.b-cdn.net/{video_id}/captions/en.vtt
    const captionUri = video.main_thumbnail_url.replace(/thumb_[0-9]+\.(jpg|png|jpeg)(\?.*)?/, 'captions/en.vtt');

    captions.push({
      uri: captionUri,
      language: 'en',
      label: 'English',
      mimeType: 'text/vtt',
    });
  }

  return {
    title: video.title,
    description: video.description,
    stream_url: video.playback_url,
    poster: video.main_thumbnail_url,
    captions,
  };
}