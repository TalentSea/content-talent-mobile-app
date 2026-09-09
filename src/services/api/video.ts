import { apiGet } from './client';
import { API_BASE_URL, DEFAULT_AD_TAG_URL, MOCK_HLS_STREAM_WITH_INBUILT_CAPTIONS } from '../../constants/config';
import { fetchHLSCaptions } from './captionsApi';
import { MOCK_VIDEOS_LIST, MOCK_VIDEO_DETAILS_MAP } from './mockVideoApi';
import { getCleanViewCountForVideo, setBackendViewCount } from '../viewTracker';
import { getCleanLikesCountForVideo, setBackendLikesCount } from '../userActivity';
import type {
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

const DISTINCT_STREAM_FALLBACKS = [
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];

export function getDistinctStreamUrlForVideo(video: any): string {
  let url =
    video?.hls_stream_url ||
    video?.playback_url ||
    video?.stream_url ||
    video?.hls_url ||
    video?.video_url ||
    video?.play_url ||
    video?.url ||
    video?.file_url ||
    video?.stream_path ||
    video?.file_path ||
    null;

  const libraryId = video?.bunny_library_id || video?.library_id;
  const videoIdStr = video?.bunny_video_id || video?.video_id;

  if (url && typeof url === 'string' && url.trim().length > 0 && url !== API_BASE_URL) {
    url = url.trim();
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    // Filter out unsigned b-cdn.net URLs without token params that cause HTTP 403 Forbidden error
    if (url.includes('b-cdn.net') && !url.includes('token') && !url.includes('expires')) {
      // Unsigned b-cdn URL, proceed to fallback
    } else {
      return url;
    }
  }

  const idNum = typeof video?.id === 'number' ? video.id : 1;
  return DISTINCT_STREAM_FALLBACKS[Math.abs(idNum) % DISTINCT_STREAM_FALLBACKS.length];
}

export function normalizeVideoItem(item: any): import('../../../types/video').ApiVideo {
  if (!item) return item;

  const rawApiViews = typeof item.views === 'number'
    ? item.views
    : (typeof item.views_count === 'number'
      ? item.views_count
      : (typeof item.view_count === 'number' ? item.view_count : 0));

  const rawApiLikes = typeof item.likes === 'number'
    ? item.likes
    : (typeof item.likes_count === 'number'
      ? item.likes_count
      : (typeof item.like_count === 'number' ? item.like_count : 0));

  if (item.id && rawApiViews > 0) {
    setBackendViewCount(item.id, rawApiViews);
  }

  if (item.id && rawApiLikes > 0) {
    setBackendLikesCount(item.id, rawApiLikes);
  }

  const finalViews = item.id ? Math.max(getCleanViewCountForVideo(item.id), rawApiViews) : rawApiViews;
  const finalLikes = item.id ? Math.max(getCleanLikesCountForVideo(item.id), rawApiLikes) : rawApiLikes;

  // Extract real thumbnail URL sent by FastAPI backend (thumbnail_url):
  let thumbUrl =
    item.thumbnail_url ||
    item.main_thumbnail_url ||
    item.thumbnail ||
    item.poster_url ||
    item.poster ||
    item.main_thumbnail ||
    null;

  if (thumbUrl && typeof thumbUrl === 'string') {
    thumbUrl = thumbUrl.trim();
    if (thumbUrl.startsWith('/')) {
      thumbUrl = `${API_BASE_URL}${thumbUrl}`;
    }
  }

  const streamUrl = getDistinctStreamUrlForVideo(item);

  return {
    ...item,
    views: finalViews,
    likes: finalLikes,
    views_count: finalViews,
    likes_count: finalLikes,
    main_thumbnail_url: thumbUrl,
    playback_url: streamUrl,
    stream_url: streamUrl,
  };
}

export async function fetchVideos(
  params: FetchVideosParams = {},
): Promise<PaginatedVideosResponse> {
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

    // Mobile Videos Endpoint (/api/v1/mobile/videos)
    const response = await apiGet<PaginatedVideosResponse>(
      `/api/v1/mobile/videos?${query.toString()}`,
    );
    if (response && Array.isArray(response.items)) {
      return {
        ...response,
        items: response.items.map(normalizeVideoItem),
      };
    }

    return {
      total: 0,
      page: 1,
      limit: 50,
      total_pages: 1,
      items: [],
    };
  } catch (error) {
    console.warn('[fetchVideos] Mobile API notice:', error);
    return {
      total: 0,
      page: 1,
      limit: 50,
      total_pages: 1,
      items: [],
    };
  }
}

export async function fetchVideoDetails(
  videoId: number,
): Promise<VideoDetails> {
  try {
    // Mobile Video Details (/api/v1/mobile/videos/{id})
    const mobileRes = await apiGet<VideoDetails>(`/api/v1/mobile/videos/${videoId}`);
    if (mobileRes) {
      return normalizeVideoItem(mobileRes) as VideoDetails;
    }
  } catch (error) {
    console.warn(`[fetchVideoDetails] Mobile API notice for video ${videoId}:`, error);
  }

  return normalizeVideoItem({
    id: videoId,
    title: `Video ${videoId}`,
    description: null,
    category: 'General',
    tags: [],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 0,
    likes: 0,
    duration: '00:00',
    main_thumbnail_url: null,
    published_at: new Date().toISOString(),
    scheduled_at: null,
    created_at: new Date().toISOString(),
    playback_url: MOCK_HLS_STREAM_WITH_INBUILT_CAPTIONS,
  }) as VideoDetails;
}

export async function fetchVideoPlayInfo(videoId: number) {
  const video = await fetchVideoDetails(videoId);
  let playUrl = getDistinctStreamUrlForVideo(video);

  const captions: import('../../../types/video').CaptionTrack[] = [];
  
  const tokenParams = playUrl.includes('?')
    ? playUrl.split('?')[1]
    : '';

  if (Array.isArray(video.captions_data) && video.captions_data.length > 0) {
    for (const cap of video.captions_data) {
      if (cap.url) {
        let captionUri = cap.url.startsWith('http')
          ? cap.url
          : cap.url.startsWith('/')
            ? `${API_BASE_URL}${cap.url}`
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

  const hlsCaptionInfo = await fetchHLSCaptions(videoId);

  const streamUrl = playUrl.startsWith('http')
    ? playUrl
    : `${API_BASE_URL}${playUrl}`;

  const mp4Url = (video as any).mp4_download_url || (streamUrl.includes('.m3u8') ? streamUrl.replace(/playlist\.m3u8.*$/, 'play_720p.mp4') : streamUrl);

  const rawDownloadUrls = (video as any).download_urls;
  let downloadUrls: Array<{ resolution: string; label: string; url: string }> = [];

  if (Array.isArray(rawDownloadUrls) && rawDownloadUrls.length > 0) {
    downloadUrls = rawDownloadUrls.map((item: any) => ({
      resolution: item.resolution || '720p',
      label: item.label || `${item.resolution || '720p'} quality`,
      url: item.url,
    }));
  } else if (streamUrl.includes('.m3u8')) {
    downloadUrls = [
      { resolution: '1080p', label: '1080p HD', url: streamUrl.replace(/playlist\.m3u8.*$/, 'play_1080p.mp4') },
      { resolution: '720p', label: '720p HD', url: streamUrl.replace(/playlist\.m3u8.*$/, 'play_720p.mp4') },
      { resolution: '480p', label: '480p SD', url: streamUrl.replace(/playlist\.m3u8.*$/, 'play_480p.mp4') },
      { resolution: '240p', label: '240p SD', url: streamUrl.replace(/playlist\.m3u8.*$/, 'play_240p.mp4') },
    ];
  } else {
    downloadUrls = [{ resolution: '720p', label: 'Standard MP4', url: streamUrl }];
  }

  return {
    id: video.id,
    title: video.title,
    description: video.description,
    category: video.category,
    tags: video.tags,
    views: video.views,
    likes: (video as any).likes ?? (video as any).likes_count ?? 0,
    duration: video.duration,
    published_at: video.published_at,
    created_at: video.created_at,
    stream_url: streamUrl,
    playback_url: streamUrl,
    mp4Url,
    downloadUrls,
    poster: video.main_thumbnail_url || undefined,
    captions,
    inbuiltCaptionTracks: hlsCaptionInfo.inbuiltCaptionTracks,
    hasInbuiltCaptions: hlsCaptionInfo.hasInbuiltCaptions,
    adTagUrl: (video as any).ad_tag_url || DEFAULT_AD_TAG_URL,
  };
}