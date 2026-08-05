import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { CardType1 } from '../VideoCard/CardType1/CardType1';
import { styles } from './styles';

interface VideoSectionProps {
  title?: string;
  videos?: any[];
  onPressVideo?: (video: any) => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  title = 'Trending Videos',
  videos = [], // Fallback default value prevents "length of undefined" crash
  onPressVideo,
}) => {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}

      {videos?.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {videos.map((item) => (
            <CardType1
              key={item.id}
              data={item}
              onPress={() => onPressVideo && onPressVideo(item)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
};