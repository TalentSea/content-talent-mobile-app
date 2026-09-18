import { apiGet } from './client';
import { API_BASE_URL, DEFAULT_AD_TAG_URL, MOCK_HLS_STREAM_WITH_INBUILT_CAPTIONS, getCreatorId } from '../../constants/config';
import { fetchHLSCaptions } from './captionsApi';
import { fetchUserSubscriptionStatus } from './subscriptionApi';
import { isUserAdFree } from './authService';
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

  if (url && typeof url === 'string' && url.trim().length > 0 && url !== API_BASE_URL) {
    url = url.trim();
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    return url;
  }

  return '';
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

  let rawHlsUrl = item.hls_stream_url || item.playback_url || item.stream_url;
  if (rawHlsUrl && typeof rawHlsUrl === 'string' && rawHlsUrl.trim().length > 0) {
    rawHlsUrl = rawHlsUrl.trim();
    if (rawHlsUrl.startsWith('/')) {
      rawHlsUrl = `${API_BASE_URL}${rawHlsUrl}`;
    }
  } else {
    rawHlsUrl = streamUrl;
  }

  return {
    ...item,
    views: finalViews,
    likes: finalLikes,
    views_count: finalViews,
    likes_count: finalLikes,
    main_thumbnail_url: thumbUrl,
    hls_stream_url: rawHlsUrl,
    playback_url: streamUrl,
    stream_url: streamUrl,
  };
}

export async function fetchVideos(
  params: FetchVideosParams = {},
): Promise<PaginatedVideosResponse> {
  try {
    const query = new URLSearchParams();

    const cid = getCreatorId();
    if (cid) {
      query.set('creator_id', String(cid));
    }

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
    const cid = getCreatorId();
    // Mobile Video Details (/api/v1/mobile/videos/{id})
    const mobileRes = await apiGet<VideoDetails>(`/api/v1/mobile/videos/${videoId}?creator_id=${cid}`);
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
    playback_url: '',
  }) as VideoDetails;
}

export async function fetchVideoPlayInfo(videoId: number) {
  const video = await fetchVideoDetails(videoId);
  let playUrl = getDistinctStreamUrlForVideo(video);

  const captions: import('../../../types/video').CaptionTrack[] = [];

  const tokenParams = playUrl.includes('?')
    ? playUrl.split('?')[1]
    : '';

  const rawCaptions = video.captions || video.captions_data;
  if (Array.isArray(rawCaptions) && rawCaptions.length > 0) {
    for (const cap of rawCaptions) {
      if (cap.url) {
        let captionUri = cap.url.startsWith('http')
          ? cap.url
          : cap.url.startsWith('/')
            ? `${API_BASE_URL}${cap.url}`
            : cap.url;

        if (tokenParams && !captionUri.includes('token=')) {
          captionUri += `${captionUri.includes('?') ? '&' : '?'}${tokenParams}`;
        }

        const rawLang = (cap.srclang || (cap as any).language || 'en').toLowerCase();
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
                : ((cap as any).language || rawLang.toUpperCase());

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

  const streamUrl = playUrl && playUrl.trim().length > 0 && playUrl !== API_BASE_URL
    ? (playUrl.startsWith('http') ? playUrl : `${API_BASE_URL}${playUrl}`)
    : '';

  const rawDownloadUrls = (video as any).download_urls;
  let downloadUrls: Array<{ resolution: string; label: string; url: string }> = [];

  if (Array.isArray(rawDownloadUrls) && rawDownloadUrls.length > 0) {
    downloadUrls = rawDownloadUrls.map((item: any) => ({
      resolution: item.resolution || '720p',
      label: item.label || `${item.resolution || '720p'} quality`,
      url: item.url,
    }));
  } else if (streamUrl && streamUrl.includes('.m3u8')) {
    downloadUrls = [
      { resolution: '1080p', label: '1080p HD', url: streamUrl.replace('playlist.m3u8', 'play_1080p.mp4') },
      { resolution: '720p', label: '720p HD', url: streamUrl.replace('playlist.m3u8', 'play_720p.mp4') },
      { resolution: '480p', label: '480p SD', url: streamUrl.replace('playlist.m3u8', 'play_480p.mp4') },
      { resolution: '240p', label: '240p SD', url: streamUrl.replace('playlist.m3u8', 'play_240p.mp4') },
    ];
  } else if (streamUrl) {
    downloadUrls = [{ resolution: '720p', label: 'Standard MP4', url: streamUrl }];
  }

  const mp4Url =
    (video as any).mp4_download_url ||
    downloadUrls.find(d => d.resolution === '720p')?.url ||
    downloadUrls[0]?.url ||
    (streamUrl.includes('.m3u8') ? streamUrl.replace('playlist.m3u8', 'play_720p.mp4') : (streamUrl || undefined));

  // Query live subscription status from backend on video select
  const liveSub = await fetchUserSubscriptionStatus();
  const userIsAdFree = isUserAdFree() || (
    liveSub.has_active_subscription &&
    liveSub.subscription?.plan_type !== 'with_ads'
  );

  const resolvedAdTagUrl = userIsAdFree
    ? undefined
    : ((video as any).ad_tag_url || undefined);

  const effectiveStream = (mp4Url && mp4Url.trim().length > 0) ? mp4Url : streamUrl;

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
    stream_url: effectiveStream,
    playback_url: effectiveStream,
    mp4Url,
    downloadUrls,
    poster: video.main_thumbnail_url || undefined,
    captions,
    inbuiltCaptionTracks: hlsCaptionInfo.inbuiltCaptionTracks,
    hasInbuiltCaptions: hlsCaptionInfo.hasInbuiltCaptions,
    adTagUrl: resolvedAdTagUrl,
  };
}