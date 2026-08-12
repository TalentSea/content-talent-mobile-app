import React from 'react';
import { FlatList, Text, View, RefreshControl } from 'react-native';
import { VideoCard } from '../VideoCard/VideoCard';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

type VerticalListProps = {
  videos: ApiVideo[];
  numColumns?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPressVideo?: (video: ApiVideo) => void;
  emptyText?: string;
  HeaderComponent?: React.ReactElement;
};

export function VerticalList({
  videos,
  numColumns = 2,
  refreshing = false,
  onRefresh,
  onPressVideo,
  emptyText = 'No videos found.',
  HeaderComponent,
}: VerticalListProps) {
  return (
    <FlatList
      data={videos}
      keyExtractor={item => String(item.id)}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={HeaderComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        ) : undefined
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <VideoCard
          id={String(item.id)}
          title={item.title}
          thumbnailUrl={item.main_thumbnail_url || undefined}
          category={item.category || undefined}
          views={item.views ? `${item.views} views` : undefined}
          durationText={item.duration || undefined}
          badgeText={item.status}
          fullWidth={numColumns > 1}
          onPress={() => onPressVideo && onPressVideo(item)}
        />
      )}
    />
  );
}
