import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import type { ApiVideo } from '../../types/video';
import { isStreamable, getStatusDisplay } from '../../constants/videoStatus';
import { getRelativeTimeString, formatViews, formatLikes, formatDurationString } from '../../utils/timeUtils';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { getCleanLikesCountForVideo, isVideoLiked } from '../../services/userActivity';
import { getCleanViewCountForVideo, subscribeViewTracker } from '../../services/viewTracker';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import { styles } from './styles';

export type VideoCardProps = {
  video?: ApiVideo;
  id?: string;
  title?: string;
  thumbnailUrl?: string;
  category?: string;
  views?: string;
  likes?: string;
  durationText?: string;
  badgeText?: string;
  fullWidth?: boolean;
  isContinueWatching?: boolean;
  hideDescription?: boolean;
  hideTags?: boolean;
  layout?: 'grid' | 'row';
  onPress?: () => void;
  onDelete?: () => void;
};

export function VideoCard({
  video,
  id: propId,
  title,
  thumbnailUrl,
  category,
  views,
  likes,
  durationText,
  badgeText,
  fullWidth = false,
  isContinueWatching = false,
  hideDescription = false,
  hideTags = false,
  layout = 'grid',
  onPress,
  onDelete,
}: VideoCardProps) {
  const { history } = useWatchHistory();
  const currentVideoId = video?.id || (propId ? parseInt(String(propId), 10) : 1);

  // Find progress percentage from watch history
  const watchHistoryItem = history.find(h => h.video.id === currentVideoId);
  const watchProgress = watchHistoryItem?.progressPercentage || 0;

  const cardTitle = title || video?.title || 'Untitled Video';
  const cardCategory = category || video?.category || '';
  const thumb = getThumbnailForVideo(video, thumbnailUrl);
  const streamable = video ? isStreamable(video.status) : true;
  const statusInfo = video ? getStatusDisplay(video.status) : null;
  const isEncoding = video?.status?.trim().toUpperCase() === 'ENCODING';
  const rawViews = getCleanViewCountForVideo(currentVideoId);
  const rawLikes = getCleanLikesCountForVideo(currentVideoId);

  const displayViews = formatViews(rawViews);
  const displayLikes = rawLikes > 0 ? `${formatLikes(rawLikes)} ${rawLikes === 1 ? 'like' : 'likes'}` : '0 likes';
  const displayDuration = formatDurationString(durationText || video?.duration);
  const uploadedTimeAgo = getRelativeTimeString(video?.published_at || video?.created_at);

  const shouldHideDescription = isContinueWatching || hideDescription;
  const shouldHideTags = isContinueWatching || hideTags;

  if (layout === 'row') {
    return (
      <Pressable style={styles.rowCard} onPress={onPress}>
        <View style={styles.rowThumbnailWrap}>
          <Image source={{ uri: thumb }} style={styles.thumbnail} />

          {onDelete ? (
            <Pressable
              style={styles.deleteBadge}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              hitSlop={8}
            >
              <Trash2 size={12} color="#FFFFFF" />
            </Pressable>
          ) : null}

          {displayDuration ? (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{displayDuration}</Text>
            </View>
          ) : null}

          {watchProgress > 0 ? (
            <View style={styles.watchProgressWrap}>
              <View style={[styles.watchProgressFill, { width: `${watchProgress}%` as any }]} />
            </View>
          ) : null}
        </View>

        <View style={styles.rowDetails}>
          <Text numberOfLines={2} style={styles.rowTitle}>
            {cardTitle}
          </Text>

          <View style={styles.rowMetaLine}>
            {cardCategory ? <Text style={styles.rowCategory}>{cardCategory}</Text> : null}
            {cardCategory ? <Text style={styles.rowDot}>•</Text> : null}
            <Text style={styles.rowMeta}>{displayViews}</Text>
            <Text style={styles.rowDot}>•</Text>
            <Text style={styles.rowMeta}>{uploadedTimeAgo}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

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

        {onDelete ? (
          <Pressable
            style={styles.deleteBadge}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={8}
          >
            <Trash2 size={12} color="#FFFFFF" />
          </Pressable>
        ) : null}

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
        {displayLikes ? (
          <>
            <Text style={styles.dot}>•</Text>
            <Text numberOfLines={1} style={styles.meta}>
              {displayLikes}
            </Text>
          </>
        ) : null}
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