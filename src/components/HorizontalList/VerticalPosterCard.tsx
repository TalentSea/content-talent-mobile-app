import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { FeedItem } from './types';

interface VerticalPosterCardProps {
  item: FeedItem;
  onPress?: () => void;
}

export const VerticalPosterCard: React.FC<VerticalPosterCardProps> = ({
  item,
  onPress,
}) => {
  const imageSource =
    typeof item.thumbnailUrl === 'string'
      ? { uri: item.thumbnailUrl }
      : item.thumbnailUrl;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      <Image source={imageSource} style={styles.thumbnail} resizeMode="cover" />

      {/* Overlay at Bottom */}
      <View style={styles.overlayContainer}>
        {item.overlayBadgeText ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.overlayBadgeText}</Text>
          </View>
        ) : null}

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default VerticalPosterCard;

const styles = StyleSheet.create({
  container: {
    width: 130,
    height: 195,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    marginRight: 12,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  badge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});