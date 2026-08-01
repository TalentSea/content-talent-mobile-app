import type { ApiVideo, PaginatedVideosResponse, VideoDetails } from '../../types/video';
import { MOCK_HLS_STREAM_WITH_INBUILT_CAPTIONS } from '../../constants/config';

export const MOCK_VIDEOS_LIST: ApiVideo[] = [
  {
    id: 1,
    bunny_video_id: 'vid_987654321_tos',
    bunny_library_id: '123456',
    title: 'Tears of Steel (HLS Inbuilt Captions Demo)',
    description: 'Blender open movie project stream featuring multi-language HLS embedded captions (English, Spanish, French, German).',
    category: 'Sci-Fi',
    tags: ['hls', 'captions', 'open-movie'],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 14200,
    duration: '12:14',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    scheduled_at: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 2,
    bunny_video_id: 'vid_987654322_sintel',
    bunny_library_id: '123456',
    title: 'Sintel Multi-Language HLS Stream',
    description: 'An open fantasy film stream demonstrating multi-track audio and embedded HLS subtitle track switching.',
    category: 'Animation',
    tags: ['hls', 'animation', 'blender'],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 8930,
    duration: '14:48',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    published_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    scheduled_at: null,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 3,
    bunny_video_id: 'vid_987654323_bbb',
    bunny_library_id: '123456',
    title: 'Big Buck Bunny (Adaptive HLS Stream)',
    description: 'Classic open-source animated short stream with embedded test captions and adaptive bitrates.',
    category: 'Animation',
    tags: ['hls', 'adaptive', 'test'],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 23100,
    duration: '09:56',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    published_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    scheduled_at: null,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 4,
    bunny_video_id: 'vid_987654324_demo4k',
    bunny_library_id: '123456',
    title: '4K HLS Stream Processing Demo',
    description: 'High-definition video currently undergoing HLS transcode and caption indexing.',
    category: 'Tech',
    tags: ['4k', 'processing', 'encoding'],
    status: 'PROCESSING',
    encode_progress: 68,
    is_playable: false,
    views: 0,
    duration: '05:30',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80',
    published_at: null,
    scheduled_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const MOCK_VIDEO_DETAILS_MAP: Record<number, VideoDetails> = {
  1: {
    ...MOCK_VIDEOS_LIST[0],
    playback_url: MOCK_HLS_STREAM_WITH_INBUILT_CAPTIONS,
    alt_thumbnail_urls: [
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    ],
    captions_data: [
      { label: 'English (Inbuilt)', srclang: 'en', isInbuilt: true },
      { label: 'Hindi (Inbuilt)', srclang: 'hi', isInbuilt: true },
      { label: 'Tamil (Inbuilt)', srclang: 'ta', isInbuilt: true },
    ],
  },
  2: {
    ...MOCK_VIDEOS_LIST[1],
    playback_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    alt_thumbnail_urls: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    ],
    captions_data: [
      { label: 'English (Inbuilt)', srclang: 'en', isInbuilt: true },
      { label: 'Hindi (Inbuilt)', srclang: 'hi', isInbuilt: true },
      { label: 'Tamil (Inbuilt)', srclang: 'ta', isInbuilt: true },
    ],
  },
  3: {
    ...MOCK_VIDEOS_LIST[2],
    playback_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    alt_thumbnail_urls: [
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    ],
    captions_data: [
      { label: 'English (Inbuilt)', srclang: 'en', isInbuilt: true },
    ],
  },
  4: {
    ...MOCK_VIDEOS_LIST[3],
    playback_url: null,
    alt_thumbnail_urls: [],
  },
};

export async function fetchMockVideos(): Promise<PaginatedVideosResponse> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 150));
  return {
    total: MOCK_VIDEOS_LIST.length,
    page: 1,
    limit: 50,
    total_pages: 1,
    items: MOCK_VIDEOS_LIST,
  };
}

export async function fetchMockVideoDetails(videoId: number): Promise<VideoDetails> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 150));
  const details = MOCK_VIDEO_DETAILS_MAP[videoId];
  if (!details) {
    return MOCK_VIDEO_DETAILS_MAP[1];
  }
  return details;
}
