import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { FeedItem } from '../HorizontalList/types';

interface CardType2Props {
  item: FeedItem;
  onPress?: () => void;
}

export const CardType2: React.FC<CardType2Props> = ({ item, onPress }) => {
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
      <View style={styles.imageWrapper}>
        <Image source={imageSource} style={styles.thumbnail} resizeMode="cover" />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      {item.category ? (
        <Text style={styles.category}>{item.category}</Text>
      ) : null}

      {item.metaString ? (
        <Text style={styles.metaText}>{item.metaString}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default CardType2;

const styles = StyleSheet.create({
  container: {
    width: 200,
    marginRight: 12,
  },
  imageWrapper: {
    width: 200,
    height: 112,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  category: {
    color: '#d5bfc0',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  metaText: {
    color: '#808080',
    fontSize: 11,
    marginTop: 2,
  },
});