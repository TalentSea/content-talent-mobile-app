import type { ApiVideo } from '../types/video';

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

  return '';
}
