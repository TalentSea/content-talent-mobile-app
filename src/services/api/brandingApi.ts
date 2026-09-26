import { apiGet } from './client';
import { getCreatorId , API_BASE_PATH } from '../../constants/config';
import type { ThemeColors } from '../../context/ThemeContext';



export type MobileBrandingResponse = {
  studio_name: string | null;
  creator_name: string | null;
  tagline: string | null;
  description: string | null;
  banner_url: string | null;
  logo_url: string | null;
  updated_at: string | null;
  colors?: Partial<ThemeColors>;
};



export async function fetchMobileBrandingApi(): Promise<MobileBrandingResponse> {
  try {
    const rawRes = await apiGet<any>(`${API_BASE_PATH}/branding`, { authenticated: false });
    
    if (rawRes) {
      const themeColors = rawRes.theme;
      let parsedColors: Partial<ThemeColors> | undefined = undefined;

      if (themeColors && typeof themeColors === 'object') {
        parsedColors = {
          primaryColor: themeColors.primaryColor,
          secondaryColor: themeColors.secondaryColor,
          activeStateColor: themeColors.activeStateColor,
          mainBackgroundColor: themeColors.mainBackgroundColor,
          cardBackgroundColor: themeColors.cardBackgroundColor,
          primaryTextColor: themeColors.primaryTextColor,
          secondaryTextColor: themeColors.secondaryTextColor,
          mutedTextColor: themeColors.mutedTextColor,
          buttonTextColor: themeColors.buttonTextColor,
        };
      }

      return {
        studio_name: rawRes.studio_name ?? null,
        creator_name: rawRes.studio_name ?? null, // Maintained for backwards compatibility
        tagline: rawRes.tagline ?? null,
        description: rawRes.description ?? null,
        banner_url: rawRes.banner_url ?? null,
        logo_url: rawRes.logo_url ?? null,
        updated_at: rawRes.updated_at ?? null,
        colors: parsedColors,
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
    colors: undefined,
  };
}


