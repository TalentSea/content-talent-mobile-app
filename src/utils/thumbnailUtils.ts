import type { ApiVideo } from '../types/video';

const DEFAULT_FALLBACK_THUMBNAILS = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
];

export function getThumbnailForVideo(video?: ApiVideo | null, fallbackUrl?: string): string {
  const url =
    video?.main_thumbnail_url ||
    (video as any)?.thumbnail_url ||
    (video as any)?.thumbnail ||
    (video as any)?.poster_url ||
    (video as any)?.poster ||
    fallbackUrl;

  if (url && typeof url === 'string' && url.trim().length > 0) {
    return url;
  }

  // Consistent static dark placeholder fallback if no thumbnail is uploaded
  return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';
}
