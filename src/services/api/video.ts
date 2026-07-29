import { VideoCardProps } from '../types/video';

const API_BASE_URL = 'http://138.68.140.83:8000';

const DEFAULT_VIDEOS: VideoCardProps[] = [
  {
    id: '1',
    title: 'Content Talent Performance Showcase 1',
    category: 'POP',
    views: '1.2M views',
    uploadedAt: '2 days ago',
    durationText: '03:45',
    progressPercent: 70,
    isFavorite: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
  },
  {
    id: '2',
    title: 'Content Talent Performance Showcase 2',
    category: 'TALENT',
    views: '850K views',
    uploadedAt: '5 days ago',
    durationText: '05:12',
    progressPercent: 30,
    isFavorite: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
  },
];

export const fetchBackendVideos = async (): Promise<VideoCardProps[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/`);
    if (!response.ok) {
      return DEFAULT_VIDEOS;
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return DEFAULT_VIDEOS;
    }

    return data.map((item: any, index: number) => ({
      id: String(item.id || index),
      title: item.title || item.name || 'Untitled Video',
      category: item.category || 'TALENT',
      views: item.views ? `${item.views}` : '1K views',
      uploadedAt: item.uploaded_at || 'Recently',
      durationText: item.duration || '03:00',
      progressPercent: item.progress || 0,
      isFavorite: Boolean(item.is_favorite),
      thumbnailUrl: item.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
    }));
  } catch (error) {
    console.warn('Backend fetch failed, using default video list:', error);
    return DEFAULT_VIDEOS;
  }
};