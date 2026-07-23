export interface VideoCardProps {
  id?: string;
  title?: string;
  thumbnailUrl?: string;
  category?: string;
  views?: string;
  uploadedAt?: string;
  durationText?: string;
  progressPercent?: number;
  isFavorite?: boolean;
  isEmpty?: boolean;
  onPress?: () => void;
  onFavoriteToggle?: () => void;
}