import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles } from './styles';

interface CardType1Props {
  item?: any;
  data?: any; // Handles both prop names just in case
  onPress?: () => void;
  aspectRatio?: string;
  width?: number;
}

export const CardType1: React.FC<CardType1Props> = ({
  item,
  data,
  onPress,
  width = 200,
}) => {
  // Safe extraction (supports either 'item' or 'data' prop)
  const videoData = item || data || {};

  // Safe thumbnail check
  const thumbnailSource = videoData.thumbnailUrl
    ? typeof videoData.thumbnailUrl === 'string'
      ? { uri: videoData.thumbnailUrl }
      : videoData.thumbnailUrl
    : videoData.thumbnail
    ? typeof videoData.thumbnail === 'string'
      ? { uri: videoData.thumbnail }
      : videoData.thumbnail
    : null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, { width }]}
    >
      <View style={styles.thumbnailContainer}>
        {thumbnailSource && (
          <Image source={thumbnailSource} style={styles.thumbnail} />
        )}
        {videoData.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{videoData.duration}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {videoData.title || 'Untitled Video'}
        </Text>
        <Text style={styles.channelName} numberOfLines={1}>
          {videoData.channelName || ''}
        </Text>
        <Text style={styles.views}>
          {videoData.views ? `${videoData.views} • ` : ''}
          {videoData.uploadedAt || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};