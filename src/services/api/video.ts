import { apiGet } from './client';
import { API_BASE_URL, USE_MOCK_VIDEOS } from '../../constants/config';
import { fetchHLSCaptions } from './captionsApi';
import { fetchMockVideos, fetchMockVideoDetails } from './mockVideoApi';
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
  if (USE_MOCK_VIDEOS) {
    return fetchMockVideos();
  }

  try {
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

    return await apiGet<PaginatedVideosResponse>(
      `/api/v1/admin/videos?${query.toString()}`,
    );
  } catch (error) {
    console.warn('[fetchVideos] Real API error, using mock videos fallback:', error);
    return fetchMockVideos();
  }
}

export async function fetchVideoDetails(
  videoId: number,
): Promise<VideoDetails> {
  if (USE_MOCK_VIDEOS) {
    return fetchMockVideoDetails(videoId);
  }

  try {
    return await apiGet<VideoDetails>(
      `/api/v1/admin/videos/${videoId}`,
    );
  } catch (error) {
    console.warn(`[fetchVideoDetails] Real API error for video ${videoId}, using mock fallback:`, error);
    return fetchMockVideoDetails(videoId);
  }
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

  if (Array.isArray(video.captions_data) && video.captions_data.length > 0) {
    for (const cap of video.captions_data) {
      if (cap.url) {
        let captionUri = cap.url.startsWith('http')
          ? cap.url
          : video.main_thumbnail_url
            ? video.main_thumbnail_url.replace(/thumb_[0-9]+\.(jpg|png|jpeg)(\?.*)?/, cap.url.replace(/^(\.\.\/)+/, ''))
            : cap.url;

        if (tokenParams && !captionUri.includes('token=')) {
          captionUri += `${captionUri.includes('?') ? '&' : '?'}${tokenParams}`;
        }

        const rawLang = (cap.srclang || 'en').toLowerCase();
        const lang = rawLang.startsWith('en')
          ? 'en'
          : rawLang.startsWith('hi')
            ? 'hi'
            : rawLang.startsWith('ta')
              ? 'ta'
              : rawLang;
        const label = cap.label && cap.label !== 'EN' && cap.label !== 'HI' && cap.label !== 'TA'
          ? cap.label
          : rawLang === 'en-auto'
            ? 'English (Auto)'
            : lang === 'hi'
              ? 'Hindi'
              : lang === 'ta'
                ? 'Tamil'
                : rawLang.toUpperCase();

        captions.push({
          uri: captionUri,
          language: lang,
          label,
          mimeType: cap.url.endsWith('.srt') ? 'application/x-subrip' : 'text/vtt',
          isInbuilt: cap.isInbuilt ?? false,
          isDefault: cap.is_default ?? true,
        });
      }
    }
  } else if (video.caption_url) {
    // Legacy single caption fallback
    let captionUri = video.caption_url.startsWith('http')
      ? video.caption_url
      : video.main_thumbnail_url
        ? video.main_thumbnail_url.replace(/thumb_[0-9]+\.(jpg|png|jpeg)(\?.*)?/, video.caption_url.replace(/^(\.\.\/)+/, ''))
        : video.caption_url;

    if (tokenParams && !captionUri.includes('token=')) {
      captionUri += `${captionUri.includes('?') ? '&' : '?'}${tokenParams}`;
    }

    const rawLang = video.caption_lang || 'en';
    const lang = rawLang.startsWith('en') ? 'en' : rawLang.startsWith('es') ? 'es' : rawLang;

    captions.push({
      uri: captionUri,
      language: lang,
      label: rawLang === 'en-auto' ? 'English (Auto)' : lang === 'es' ? 'Spanish' : 'English',
      mimeType: video.caption_url.endsWith('.srt') ? 'application/x-subrip' : 'text/vtt',
    });
  }

  // Fetch HLS caption metadata via mock / real API service
  const hlsCaptionInfo = await fetchHLSCaptions(videoId);

  const streamUrl = video.playback_url.startsWith('http')
    ? video.playback_url
    : `${API_BASE_URL}${video.playback_url}`;

  return {
    title: video.title,
    description: video.description,
    stream_url: streamUrl,
    poster: video.main_thumbnail_url,
    captions,
    inbuiltCaptionTracks: hlsCaptionInfo.inbuiltCaptionTracks,
    hasInbuiltCaptions: hlsCaptionInfo.hasInbuiltCaptions,
    adTagUrl: (video as any).ad_tag_url || undefined,
  };
}