import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { FeedItem } from '../HorizontalList/types';
import { styles } from './styles';

interface CardType1Props {
  item: FeedItem;
  aspectRatio?: '16:9' | '2:3' | '1:1';
  width?: number;
  onPress?: () => void;
}

export const CardType1: React.FC<CardType1Props> = ({
  item,
  aspectRatio = '16:9',
  width = 200,
  onPress,
}) => {
  const numericRatio =
    aspectRatio === '2:3' ? 2 / 3 : aspectRatio === '1:1' ? 1 : 16 / 9;
  const computedHeight = width / numericRatio;

  const imageSource =
    typeof item.thumbnailUrl === 'string'
      ? { uri: item.thumbnailUrl }
      : item.thumbnailUrl;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, { width }]}
    >
      <View
        style={[
          styles.imageWrapper,
          { width: width, height: computedHeight },
        ]}
      >
        {item.thumbnailUrl ? (
          <Image
            source={imageSource}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : null}

        {/* Overlay Badge */}
        {item.overlayBadgeText ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.overlayBadgeText}</Text>
          </View>
        ) : null}

        {/* Duration Badge */}
        {item.durationText ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.durationText}</Text>
          </View>
        ) : null}

        {/* Progress Bar */}
        {item.progressPercent !== undefined ? (
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: `${item.progressPercent}%` },
              ]}
            />
          </View>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>

      {item.category ? (
        <Text style={styles.category}>{item.category}</Text>
      ) : null}

      {item.metaString ? (
        <Text style={styles.metaString}>{item.metaString}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default CardType1;