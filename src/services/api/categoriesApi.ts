import { apiGet } from './client';

export type MobileCategoryItem = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string;
  color?: string;
  video_count?: number;
};

export type MobileCategoriesResponse = {
  data: MobileCategoryItem[];
};

export async function fetchCategoriesApi(): Promise<MobileCategoryItem[]> {
  const endpoints = [
    `/api/v1/mobile/categories`,
  ];

  for (const path of endpoints) {
    try {
      const response = await apiGet<any>(path);
      const list = Array.isArray(response)
        ? response
        : response?.data || response?.items || response?.categories;

      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any, idx: number) => ({
          id: item.id || idx + 1,
          name: item.name || item.title || item.category_name || 'Category',
          slug: item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : `cat_${idx}`),
          description: item.description || item.subtitle || item.desc || null,
          color: item.color,
          icon: item.icon,
          video_count: item.video_count ?? item.videos_count ?? item.count ?? item.total_videos ?? undefined,
        }));
      }
    } catch (error) {
      console.warn(`[fetchCategoriesApi] Endpoint ${path} notice:`, error);
    }
  }

  return [];
}
