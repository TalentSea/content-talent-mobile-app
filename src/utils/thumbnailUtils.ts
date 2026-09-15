import type { ApiVideo } from '../types/video';

const DEFAULT_FALLBACK_THUMBNAILS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
];

export function getThumbnailForVideo(video?: ApiVideo | null, fallbackUrl?: string): string {
  if (video?.main_thumbnail_url && typeof video.main_thumbnail_url === 'string' && video.main_thumbnail_url.trim().length > 0) {
    return video.main_thumbnail_url;
  }
  if (fallbackUrl && typeof fallbackUrl === 'string' && fallbackUrl.trim().length > 0) {
    return fallbackUrl;
  }
  const id = video?.id || 1;
  return DEFAULT_FALLBACK_THUMBNAILS[Math.abs(id) % DEFAULT_FALLBACK_THUMBNAILS.length];
}
