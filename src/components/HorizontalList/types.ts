import { ImageSourcePropType } from 'react-native';

/** Supported visual variants for horizontal rows */
export type CardStyle = 'style1' | 'style2' | 'style3';

/** Data model for items rendered inside the horizontal list */
export interface FeedItem {
  id: string;
  thumbnailUrl: ImageSourcePropType | string;
  title?: string;
  category?: string;
  durationText?: string;
  progressPercent?: number;  // Respected by style1
  metaString?: string;        // Respected by style2
  overlayBadgeText?: string;  // Respected by style3
  onPress?: () => void;       // Optional item-specific tap override
}

/** Input props for the primary HorizontalList component */
export interface HorizontalListProps {
  /** Input 1: Layout style selector (constant) */
  cardStyle: CardStyle;
  
  /** Input 2: Feed data array */
  feedData: FeedItem[];
  
  /** Global tap handler for items in the row */
  onItemPress?: (item: FeedItem) => void;
  
  /** Shows skeleton shimmer states when fetching data */
  isLoading?: boolean;
}