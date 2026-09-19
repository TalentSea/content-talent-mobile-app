import { apiGet } from './client';
import { getCreatorId } from '../../constants/config';

export type MobileBannerItem = {
  id: string | number;
  title: string;
  description?: string;
  image_url: string;
  video_id?: number;
  category?: string;
};

export type MobileBrandingResponse = {
  studio_name: string | null;
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

const parseBannerItem = (b: any): MobileBannerItem => {
  let vidId: number | undefined = undefined;
  let titleStr = '';
  let descStr = '';
  let categoryStr: string | undefined = undefined;
  let imgUrl = '';

  if (typeof b === 'number') {
    vidId = b;
  } else if (typeof b === 'string' && !isNaN(Number(b))) {
    vidId = Number(b);
  } else if (b && typeof b === 'object') {
    const vObj = b.video || b;
    vidId = b.video_id || b.id || (typeof b.video === 'number' ? b.video : (vObj.id || vObj.video_id));
    if (typeof vidId === 'string' && !isNaN(Number(vidId))) {
      vidId = Number(vidId);
    }
    titleStr = b.title || b.name || vObj.title || vObj.name || '';
    descStr = b.description || vObj.description || '';
    categoryStr = b.category || vObj.category;
    imgUrl = findBannerUrl(b) || findBannerUrl(vObj) || b.image_url || b.thumbnail_url || vObj.thumbnail_url || vObj.main_thumbnail_url || '';
  }

  return {
    id: (b && b.id) || vidId || Math.random(),
    title: titleStr,
    description: descStr,
    image_url: imgUrl,
    video_id: vidId,
    category: categoryStr,
  };
};

export async function fetchMobileBrandingApi(): Promise<MobileBrandingResponse> {
  try {
    const rawRes = await apiGet<any>('/api/v1/mobile/branding');
    if (rawRes) {
      const data = rawRes.data || rawRes.branding || rawRes;
      const studioName = data.studio_name ?? null;
      const tagline = data.tagline ?? null;
      const description = data.description ?? null;
      const bannerUrl = data.banner_url ?? null;
      const logoUrl = data.logo_url ?? null;
      const updatedAt = data.updated_at ?? null;

      const rawBanners = data.featured_videos || data.featured_banners || [];
      const parsedBanners: MobileBannerItem[] = Array.isArray(rawBanners)
        ? rawBanners.map(parseBannerItem)
        : [];

      return {
        studio_name: studioName,
        creator_name: studioName || data.creator_name || null,
        tagline: tagline,
        description: description,
        banner_url: bannerUrl,
        logo_url: logoUrl,
        updated_at: updatedAt,
        featured_videos: parsedBanners,
      };
    }
  } catch (error) {
    console.warn('[fetchMobileBrandingApi] Error fetching /api/v1/mobile/branding:', error);
  }

  return {
    studio_name: null,
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
  try {
    const rawRes = await apiGet<any>('/api/v1/mobile/featured-videos');
    const itemsList = Array.isArray(rawRes)
      ? rawRes
      : rawRes?.items || rawRes?.data || rawRes?.featured_videos;

    if (Array.isArray(itemsList) && itemsList.length > 0) {
      return itemsList.map(parseBannerItem);
    }
  } catch (e) {
    console.warn('[fetchMobileBannersApi] Error fetching /api/v1/mobile/featured-videos:', e);
  }

  return [];
}
