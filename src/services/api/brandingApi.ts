import { apiGet } from './client';

export type MobileBannerItem = {
  id: string | number;
  title: string;
  description?: string;
  image_url: string;
  video_id?: number;
  category?: string;
};

export type MobileBrandingResponse = {
  creator_name: string | null;
  tagline: string | null;
  description: string | null;
  banner_url: string | null;
  logo_url: string | null;
  updated_at: string | null;
  featured_videos?: MobileBannerItem[];
};

const findBannerUrl = (obj: any): string | null => {
  if (!obj || typeof obj !== 'object') return null;
  const keys = [
    'banner_url',
    'banner_image_url',
    'banner_image',
    'banner_path',
    'creator_banner',
    'creator_banner_url',
    'cover_banner',
    'cover_banner_url',
    'cover_url',
    'cover_image',
    'cover',
    'banner',
    'hero_banner',
    'hero_banner_url',
    'hero_image',
    'background_url',
    'background_image',
    'header_banner',
    'header_url',
    'branding_banner',
    'image_url',
    'thumbnail_url',
  ];
  for (const k of keys) {
    if (obj[k] && typeof obj[k] === 'string' && obj[k].trim() !== '') {
      return obj[k];
    }
  }
  for (const k of Object.keys(obj)) {
    const lk = k.toLowerCase();
    if ((lk.includes('banner') || lk.includes('cover') || lk.includes('thumb') || lk.includes('image')) && typeof obj[k] === 'string' && obj[k].trim() !== '') {
      return obj[k];
    }
  }
  return null;
};

const findLogoUrl = (obj: any): string | null => {
  if (!obj || typeof obj !== 'object') return null;
  const keys = [
    'logo_url',
    'logo_image_url',
    'logo_image',
    'logo_path',
    'creator_logo',
    'creator_logo_url',
    'avatar_url',
    'avatar',
    'logo',
    'icon_url',
  ];
  for (const k of keys) {
    if (obj[k] && typeof obj[k] === 'string' && obj[k].trim() !== '') {
      return obj[k];
    }
  }
  for (const k of Object.keys(obj)) {
    const lk = k.toLowerCase();
    if ((lk.includes('logo') || lk.includes('avatar')) && typeof obj[k] === 'string' && obj[k].trim() !== '') {
      return obj[k];
    }
  }
  return null;
};

export async function fetchMobileBrandingApi(): Promise<MobileBrandingResponse> {
  const endpoints = [
    '/api/v1/mobile/branding',
    '/api/v1/branding',
    '/api/v1/admin/branding',
    '/api/v1/branding/info',
  ];

  for (const path of endpoints) {
    try {
      const rawRes = await apiGet<any>(path);
      if (rawRes) {
        const data = rawRes.data || rawRes.branding || rawRes.creator || rawRes;
        const detectedBanner = findBannerUrl(data) || findBannerUrl(rawRes);
        const detectedLogo = findLogoUrl(data) || findLogoUrl(rawRes);

        const rawBanners =
          data.featured_videos ||
          data.featured_banners ||
          data.featured ||
          data.banners ||
          rawRes.featured_videos ||
          rawRes.featured_banners ||
          rawRes.banners ||
          [];

        const parsedBanners: MobileBannerItem[] = Array.isArray(rawBanners)
          ? rawBanners.map((b: any) => ({
              id: b.id || b.video_id || Math.random(),
              title: b.title || b.name || 'Featured Video',
              description: b.description || '',
              image_url: findBannerUrl(b) || b.image_url || b.thumbnail_url || b.banner_url || '',
              video_id: b.video_id || b.id,
              category: b.category,
            }))
          : [];

        if (detectedBanner || detectedLogo || data.creator_name || data.name || parsedBanners.length > 0) {
          return {
            creator_name: data.creator_name || data.studio_name || data.name || rawRes.creator_name || null,
            tagline: data.tagline || data.subtitle || rawRes.tagline || null,
            description: data.description || data.bio || rawRes.description || null,
            banner_url: detectedBanner,
            logo_url: detectedLogo,
            updated_at: data.updated_at || rawRes.updated_at || null,
            featured_videos: parsedBanners,
          };
        }
      }
    } catch (error) {
      console.warn(`[fetchMobileBrandingApi] Endpoint ${path} notice:`, error);
    }
  }

  return {
    creator_name: null,
    tagline: null,
    description: null,
    banner_url: null,
    logo_url: null,
    updated_at: null,
    featured_videos: [],
  };
}

export async function fetchMobileBannersApi(): Promise<MobileBannerItem[]> {
  const endpoints = [
    '/api/v1/mobile/banners',
    '/api/v1/banners',
    '/api/v1/admin/banners',
  ];

  for (const path of endpoints) {
    try {
      const rawRes = await apiGet<any>(path);
      const itemsList = Array.isArray(rawRes) ? rawRes : rawRes?.items || rawRes?.data || rawRes?.banners;
      if (Array.isArray(itemsList) && itemsList.length > 0) {
        return itemsList.map((b: any) => ({
          id: b.id || Math.random(),
          title: b.title || b.name || 'Featured Video',
          description: b.description || '',
          image_url: findBannerUrl(b) || b.image_url || b.thumbnail_url || '',
          video_id: b.video_id || b.id,
          category: b.category,
        }));
      }
    } catch (e) {
      console.warn(`[fetchMobileBannersApi] Endpoint ${path} notice:`, e);
    }
  }

  return [];
}
