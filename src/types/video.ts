// src/types/video.ts
export interface Card1Props {
  thumbnailUrl: string;
  title: string;
  category: string;
  durationText: string;
  progressPercent: number; // 0 to 100
  isLoading?: boolean;
  onPress?: () => void;
}

export interface Card2Props {
  thumbnailUrl: string;
  title: string;
  category?: string; // Optional label badge
  durationText: string;
  metaString: string; // e.g. "2.4M views • 3 weeks ago"
  isLoading?: boolean;
  onPress?: () => void;
}

// Mock Data Example
export const MOCK_CONTINUE_WATCHING: Card1Props = {
  thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
  title: 'The Silent Mountain',
  category: 'Documentary',
  durationText: '1h 42m',
  progressPercent: 45,
};

export const MOCK_LIST_ITEM: Card2Props = {
  thumbnailUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785',
  title: 'City Lights at Midnight',
  category: 'Travel',
  durationText: '52m',
  metaString: '1.1M • 4 weeks ago',
};