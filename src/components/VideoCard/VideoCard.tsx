import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { ApiVideo } from '../../types/video';
import { isStreamable, getStatusDisplay } from '../../constants/videoStatus';
import { getRelativeTimeString, formatViews, formatDurationString } from '../../utils/timeUtils';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { styles } from './styles';

import { getThumbnailForVideo } from '../../utils/thumbnailUtils';

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
  isContinueWatching?: boolean;
  hideDescription?: boolean;
  hideTags?: boolean;
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
  isContinueWatching = false,
  hideDescription = false,
  hideTags = false,
  onPress,
}: VideoCardProps) {
  const { history } = useWatchHistory();
  const currentVideoId = video?.id || (id ? parseInt(id) : 1);

  // Find progress percentage from watch history
  const watchHistoryItem = history.find(h => h.video.id === currentVideoId);
  const watchProgress = watchHistoryItem?.progressPercentage || 0;

  const cardTitle = title || video?.title || 'Untitled Video';
  const cardCategory = category || video?.category || '';
  const thumb = getThumbnailForVideo(video, thumbnailUrl);
  const streamable = video ? isStreamable(video.status) : true;
  const statusInfo = video ? getStatusDisplay(video.status) : null;
  const isEncoding = video?.status?.trim().toUpperCase() === 'ENCODING';

  const displayViews = views || formatViews(video?.views);
  const displayDuration = formatDurationString(durationText || video?.duration);
  const uploadedTimeAgo = getRelativeTimeString(video?.published_at || video?.created_at);

  const shouldHideDescription = isContinueWatching || hideDescription;
  const shouldHideTags = isContinueWatching || hideTags;

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

        {/* Watch Progress Red Line at bottom of thumbnail */}
        {watchProgress > 0 ? (
          <View style={styles.watchProgressWrap}>
            <View
              style={[
                styles.watchProgressFill,
                { width: `${watchProgress}%` as any },
              ]}
            />
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

      {/* Video Description preview (Hidden for Continue Watching) */}
      {!shouldHideDescription && video?.description ? (
        <Text numberOfLines={2} style={styles.descriptionText}>
          {video.description}
        </Text>
      ) : null}

      {/* Meta row */}
      <View style={styles.metaRow}>
        {cardCategory && cardCategory.toLowerCase() !== 'general' ? (
          <>
            <Text numberOfLines={1} style={styles.category}>
              {cardCategory}
            </Text>
            <Text style={styles.dot}>•</Text>
          </>
        ) : null}
        <Text numberOfLines={1} style={styles.meta}>
          {displayViews}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text numberOfLines={1} style={styles.uploadedTimeText}>
          {uploadedTimeAgo}
        </Text>
      </View>

      {/* Tag Pills (Hidden for Continue Watching) */}
      {!shouldHideTags && video?.tags && video.tags.length > 0 ? (
        <View style={styles.tagContainer}>
          {video.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tagPill}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}