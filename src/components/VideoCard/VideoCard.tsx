import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';

// 1. Merged Props Interface
export interface VideoCardProps {
  id?: string;
  title?: string;
  thumbnailUrl?: string;
  category?: string;
  views?: string;
  uploadedAt?: string;
  durationText?: string;
  progressPercent?: number; // 0 to 100 for video watch history
  isFavorite?: boolean;
  isEmpty?: boolean; // Renders clean dark skeleton placeholder
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onFavoriteToggle?: () => void;
}

// 2. Video Card Component
export const VideoCard: React.FC<VideoCardProps> = ({
  title,
  thumbnailUrl,
  category,
  views,
  uploadedAt,
  durationText,
  progressPercent,
  isFavorite = false,
  isEmpty = false,
  style,
  onPress,
  onFavoriteToggle,
}) => {
  const [imageError, setImageError] = useState(false);

  const isSkeleton = isEmpty || (!title && !thumbnailUrl);

  return (
    <TouchableOpacity
      style={[styles.cardContainer, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isSkeleton || !onPress}
    >
      {/* --- THUMBNAIL CONTAINER --- */}
      <View style={styles.thumbnailWrapper}>
        {!isSkeleton && thumbnailUrl && !imageError ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Placeholder / Fallback Box */
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderIcon}>🎬</Text>
          </View>
        )}

        {/* Favorite Heart Button Overlay */}
        {!isSkeleton && onFavoriteToggle && (
          <TouchableOpacity
            style={styles.favoriteBadge}
            onPress={onFavoriteToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.favoriteText}>{isFavorite ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        )}

        {/* Duration Badge */}
        {!isSkeleton && durationText && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{durationText}</Text>
          </View>
        )}

        {/* Progress Bar (Continue Watching) */}
        {!isSkeleton && progressPercent !== undefined && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progressPercent))}%` }]} />
          </View>
        )}
      </View>

      {/* --- METADATA SECTION --- */}
      <View style={styles.detailsContainer}>
        {isSkeleton ? (
          /* Skeleton Loading Lines */
          <>
            <View style={styles.skeletonTitleLine} />
            <View style={styles.skeletonMetaLine} />
          </>
        ) : (
          <>
            {/* Title */}
            {title && (
              <Text style={styles.titleText} numberOfLines={2}>
                {title}
              </Text>
            )}

            {/* Meta Line (Category • Views • Upload Date) */}
            <Text style={styles.metaText} numberOfLines={1}>
              {[category, views, uploadedAt].filter(Boolean).join(' • ')}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// 3. Complete Component Styles
const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  thumbnailWrapper: {
    width: '100%',
    height: 195,
    backgroundColor: '#161616',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 28,
    opacity: 0.3,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteText: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: 'bold',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E50914',
  },
  detailsContainer: {
    padding: 12,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  /* Skeleton styles */
  skeletonTitleLine: {
    width: '80%',
    height: 14,
    backgroundColor: '#222222',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonMetaLine: {
    width: '40%',
    height: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
  },
});