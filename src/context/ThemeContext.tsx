import React, { createContext, useContext, useMemo, useState } from 'react';
import type { MobileBrandingResponse } from '../services/api/brandingApi';

export type ThemeColors = {
  /** Used for main buttons, loading spinners, and the video player timeline tracker */
  primaryColor: string;
  /** Used for highlight badges like "VIP", "4K", "Trending", or "New" */
  secondaryColor: string;
  /** Used to highlight the currently selected navigation tab or menu icon */
  activeStateColor: string;
  /** The root background screens color across all application */
  mainBackgroundColor: string;
  /** The surface color for video rows, containers, search bars, and pop-up modals */
  cardBackgroundColor: string;
  /** Used for high-importance text like video titles and main section headings */
  primaryTextColor: string;
  /** Used for metadata details like view counts, release dates, and video descriptions */
  secondaryTextColor: string;
  /** Used for low-priority placeholder text inside empty search bars and input fields */
  mutedTextColor: string;
  /** The text color used inside filled buttons to guarantee strict contrast readability */
  buttonTextColor: string;
};

export const defaultThemeColors: ThemeColors = {
  primaryColor: '#6366F1',
  secondaryColor: '#EC4899',
  activeStateColor: '#6366F1',
  mainBackgroundColor: '#FFFFFF',
  cardBackgroundColor: '#0F0F1A',
  primaryTextColor: '#FFFFFF',
  secondaryTextColor: '#9CA3AF',
  mutedTextColor: '#6B7280',
  buttonTextColor: '#FFFFFF',
};

export type ThemeContextType = {
  theme: ThemeColors;
  branding: MobileBrandingResponse | null;
  setTheme: (colors: Partial<ThemeColors>) => void;
  setBranding: (branding: MobileBrandingResponse | null) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({
  children,
  initialColors,
  initialBranding = null,
}: {
  children: React.ReactNode;
  initialColors?: Partial<ThemeColors>;
  initialBranding?: MobileBrandingResponse | null;
}) {
  const [theme, setThemeState] = useState<ThemeColors>(() => ({
    ...defaultThemeColors,
    ...initialColors,
  }));
  const [branding, setBrandingState] = useState<MobileBrandingResponse | null>(initialBranding);

  const setTheme = (newColors: Partial<ThemeColors>) => {
    setThemeState(prev => ({
      ...prev,
      ...newColors,
    }));
  };

  const setBranding = (newBranding: MobileBrandingResponse | null) => {
    setBrandingState(newBranding);
  };

  const value = useMemo(
    () => ({
      theme,
      branding,
      setTheme,
      setBranding,
    }),
    [theme, branding],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: defaultThemeColors,
      branding: null,
      setTheme: () => { },
      setBranding: () => { },
    };
  }
  return context;
}
