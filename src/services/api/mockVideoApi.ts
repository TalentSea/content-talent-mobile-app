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
    tags: ['hls', 'captions', 'open-movie', 'blender'],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 45200,
    likes: 3420,
    duration: '12:14',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    published_at: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    scheduled_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    bunny_video_id: 'vid_987654322_sintel',
    bunny_library_id: '123456',
    title: 'Sintel Multi-Language HLS Stream',
    description: 'An open fantasy film stream demonstrating multi-track audio and embedded HLS subtitle track switching.',
    category: 'Animation',
    tags: ['hls', 'animation', 'blender', 'fantasy'],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 89300,
    likes: 7150,
    duration: '14:48',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    published_at: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    scheduled_at: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 3,
    bunny_video_id: 'vid_987654323_bbb',
    bunny_library_id: '123456',
    title: 'Big Buck Bunny (Adaptive HLS Stream)',
    description: 'Classic open-source animated short stream with embedded test captions and adaptive bitrates.',
    category: 'Animation',
    tags: ['hls', 'adaptive', 'test', '3d'],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 123100,
    likes: 9800,
    duration: '09:56',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    published_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    scheduled_at: null,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 5,
    bunny_video_id: 'vid_987654325_react_native',
    bunny_library_id: '123456',
    title: 'React Native Architecture & Performance Masterclass',
    description: 'Deep dive into New Architecture, TurboModules, and Fabric renderer optimizations.',
    category: 'Tech',
    tags: ['react-native', 'mobile', 'javascript', 'performance'],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 67400,
    likes: 5210,
    duration: '22:15',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    published_at: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago (Latest!)
    scheduled_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 6,
    bunny_video_id: 'vid_987654326_fastapi',
    bunny_library_id: '123456',
    title: 'FastAPI Microservices & Video Streaming Backend',
    description: 'Build scalable Python video streaming backends with JWT authentication and Async SQLAlchemy.',
    category: 'Development',
    tags: ['python', 'fastapi', 'backend', 'streaming'],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 31200,
    likes: 2430,
    duration: '18:40',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    published_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    scheduled_at: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 7,
    bunny_video_id: 'vid_987654327_ui_ux',
    bunny_library_id: '123456',
    title: 'Modern OTT Mobile UI Design Systems',
    description: 'Design dark glassmorphism video interfaces in Figma and translate them to React Native components.',
    category: 'Design',
    tags: ['figma', 'ui-ux', 'mobile-design', 'glassmorphism'],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: 54100,
    likes: 4180,
    duration: '15:20',
    main_thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    published_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    scheduled_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
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
    encode_progress: 65,
    is_playable: false,
    views: 120,
    likes: 15,
    duration: null,
    main_thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    published_at: null,
    scheduled_at: new Date(Date.now() + 86400000 * 1).toISOString(),
    created_at: new Date().toISOString(),
  },
];

const catalogListeners: Set<() => void> = new Set();

function notifyCatalogListeners() {
  catalogListeners.forEach(fn => fn());
}

export function subscribeVideoCatalog(listener: () => void): () => void {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
  };
}

export function incrementMockVideoViews(videoId: number) {
  const item = MOCK_VIDEOS_LIST.find(v => v.id === videoId);
  if (item) {
    item.views = (item.views || 0) + 1;
  }
  if (MOCK_VIDEO_DETAILS_MAP[videoId]) {
    MOCK_VIDEO_DETAILS_MAP[videoId].views = (MOCK_VIDEO_DETAILS_MAP[videoId].views || 0) + 1;
  }
  notifyCatalogListeners();
}

export function toggleMockVideoLike(videoId: number, isLiked: boolean) {
  const item = MOCK_VIDEOS_LIST.find(v => v.id === videoId);
  if (item) {
    item.likes = Math.max(0, (item.likes || 0) + (isLiked ? 1 : -1));
  }
  if (MOCK_VIDEO_DETAILS_MAP[videoId]) {
    MOCK_VIDEO_DETAILS_MAP[videoId].likes = Math.max(0, (MOCK_VIDEO_DETAILS_MAP[videoId].likes || 0) + (isLiked ? 1 : -1));
  }
  notifyCatalogListeners();
}

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
  5: {
    ...MOCK_VIDEOS_LIST[3],
    playback_url: MOCK_HLS_STREAM_WITH_INBUILT_CAPTIONS,
    alt_thumbnail_urls: [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    ],
  },
  6: {
    ...MOCK_VIDEOS_LIST[4],
    playback_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    alt_thumbnail_urls: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    ],
  },
  7: {
    ...MOCK_VIDEOS_LIST[5],
    playback_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    alt_thumbnail_urls: [
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    ],
  },
  4: {
    ...MOCK_VIDEOS_LIST[6],
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
    items: [...MOCK_VIDEOS_LIST],
  };
}

export async function fetchMockVideoDetails(videoId: number): Promise<VideoDetails> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 150));
  const details = MOCK_VIDEO_DETAILS_MAP[videoId];
  if (!details) {
    return MOCK_VIDEO_DETAILS_MAP[1];
  }
  return { ...details };
}

