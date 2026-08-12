import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { ApiVideo } from '../../types/video';
import { isStreamable, getStatusDisplay } from '../../constants/videoStatus';
import { styles } from './styles';

export type VideoCardProps = {
  video?: ApiVideo;
  id?: string;
  title?: string;
  thumbnailUrl?: string;
  category?: string;
  views?: string;
  durationText?: string;
  badgeText?: string;
  fullWidth?: boolean;
  onPress?: () => void;
};

export function VideoCard({
  video,
  id,
  title,
  thumbnailUrl,
  category,
  views,
  durationText,
  badgeText,
  fullWidth = false,
  onPress,
}: VideoCardProps) {
  const cardTitle = title || video?.title || 'Untitled Video';
  const cardCategory = category || video?.category || 'Video';
  const thumb =
    thumbnailUrl ||
    video?.main_thumbnail_url ||
    'https://via.placeholder.com/400x240/14141F/FFFFFF?text=No+Thumbnail';
  const streamable = video ? isStreamable(video.status) : true;
  const statusInfo = video ? getStatusDisplay(video.status) : null;
  const isEncoding = video?.status?.trim().toUpperCase() === 'ENCODING';
  const displayViews = views || (video?.views ? `${video.views} views` : undefined);
  const displayDuration = durationText || video?.duration;

  return (
    <Pressable
      style={[styles.card, fullWidth ? styles.cardFullWidth : null]}
      onPress={onPress}
    >
      <View
        style={[
          styles.thumbnailWrap,
          fullWidth ? styles.thumbnailWrapFullWidth : null,
        ]}
      >
        <Image source={{ uri: thumb }} style={styles.thumbnail} />

        <View style={styles.playBadge}>
          <Text style={styles.playIcon}>{streamable ? '▶' : '…'}</Text>
        </View>

        {displayDuration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{displayDuration}</Text>
          </View>
        ) : null}

        {statusInfo && !streamable ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.color },
            ]}
          >
            <Text style={styles.statusText}>{badgeText || statusInfo.label}</Text>
          </View>
        ) : null}

        {isEncoding && video?.encode_progress != null ? (
          <View style={styles.encodeProgressWrap}>
            <View
              style={[
                styles.encodeProgressFill,
                { width: `${video.encode_progress}%` as any },
              ]}
            />
          </View>
        ) : null}
      </View>

      <Text numberOfLines={1} style={styles.videoTitle}>
        {cardTitle}
      </Text>

      <View style={styles.metaRow}>
        <Text numberOfLines={1} style={styles.category}>
          {cardCategory}
        </Text>
        {displayViews ? (
          <>
            <Text style={styles.dot}>•</Text>
            <Text numberOfLines={1} style={styles.meta}>
              {displayViews}
            </Text>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}