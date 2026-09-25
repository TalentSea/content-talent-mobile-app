import { API_BASE_PATH } from '../../constants/config';
import { apiGet } from './client';

export type FeaturedVideo = {
  id: number;
  position: number;
  title: string;
  description: string | null;
  category: string | null;
  main_thumbnail_url: string | null;
  duration: string | null;
  views: number;
  likes: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
};

export async function fetchFeaturedVideosApi(): Promise<FeaturedVideo[]> {
  try {
    const rawRes = await apiGet<FeaturedVideo[]>(`${API_BASE_PATH}/featured-videos`);
    
    if (rawRes) {
      if (Array.isArray(rawRes)) return rawRes;
      if (Array.isArray(rawRes.items)) return rawRes.items;
      if (Array.isArray(rawRes.data)) return rawRes.data;
    }
  } catch (e) {
    console.warn('[fetchFeaturedVideosApi] Error fetching /api/v1/mobile/featured-videos:', e);
  }
  
  return [];
}
