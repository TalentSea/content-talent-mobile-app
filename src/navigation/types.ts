export type VideoSectionKey = 'popular' | 'processing' | 'continue' | 'recent' | 'downloads' | 'saved' | 'liked';

// ─── Root Stack ─────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Login: { mode?: 'login' | 'register' } | undefined;
  Register: undefined;
  MainTabs: undefined;
};

// ─── Home Tab Stack ──────────────────────────────────────────────────────────
// Screens navigated to from the Home tab
export type HomeStackParamList = {
  Home: undefined;
  Search: undefined;
  VideoGrid: { section: VideoSectionKey };
  Playlist: undefined;
  PlaylistDetail: {
    playlistId?: number | string;
    category?: string;
    description?: string;
  };
};

// ─── Categories Tab Stack ────────────────────────────────────────────────────
// Screens navigated to from the Categories tab
export type CategoriesStackParamList = {
  Categories: undefined;
  CategoryDetail: {
    category: string;
    slug?: string;
    description?: string;
  };
};

// ─── Profile Tab Stack ───────────────────────────────────────────────────────
// Screens navigated to from the Profile tab
export type ProfileStackParamList = {
  Profile: undefined;
  Notifications: undefined;
  Library: { type: 'history' | 'downloads' | 'liked' | 'saved' };
  Settings: undefined;
  Subscription: undefined;
};

// ─── Tab Navigator ───────────────────────────────────────────────────────────
export type MainTabParamList = {
  HomeTab: undefined;
  ShortsTab: undefined;
  CategoriesTab: undefined;
  ProfileTab: undefined;
};
