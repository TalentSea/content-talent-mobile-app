import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles } from './styles';

export interface CardType2Props {
  data: {
    id: string;
    title: string;
    channelName: string;
    views: string;
    uploadedAt: string;
    duration: string;
    thumbnail: any;
  };
  onPress?: () => void;
}

export const CardType2: React.FC<CardType2Props> = ({ data, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.thumbnailContainer}>
        <Image source={data.thumbnail} style={styles.thumbnail} />
        {data.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{data.duration}</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={2}>{data.title}</Text>
        <Text style={styles.metaText} numberOfLines={1}>{data.views} • {data.uploadedAt}</Text>
        <Text style={styles.metaText} numberOfLines={1}>{data.channelName}</Text>
      </View>
    </TouchableOpacity>
  );
};