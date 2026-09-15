import React from 'react';
import { FlatList, Text, Pressable, View } from 'react-native';
import { VideoCard } from '../VideoCard/VideoCard';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

type HorizontalListProps = {
  title: string;
  videos: ApiVideo[];
  isContinueWatching?: boolean;
  onPressVideo?: (video: ApiVideo) => void;
  onSeeAll?: () => void;
  emptyText?: string;
};

export function HorizontalList({
  title,
  videos,
  isContinueWatching,
  onPressVideo,
  onSeeAll,
  emptyText = 'No videos available.',
}: HorizontalListProps) {
  const isContinueWatchingList =
    isContinueWatching ?? title.toLowerCase().includes('continue watching');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll ? (
          <Pressable style={styles.seeAllButton} onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See all</Text>
          </Pressable>
        ) : null}
      </View>

      {videos.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item, index) => `hlist-${item.id}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              id={String(item.id)}
              title={item.title}
              thumbnailUrl={item.main_thumbnail_url || undefined}
              category={item.category || undefined}
              views={item.views ? `${item.views} views` : undefined}
              durationText={item.duration || undefined}
              badgeText={item.status}
              isContinueWatching={isContinueWatchingList}
              onPress={() => onPressVideo && onPressVideo(item)}
            />
          )}
        />
      )}
    </View>
  );
}
