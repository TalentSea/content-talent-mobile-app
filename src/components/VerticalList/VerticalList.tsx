import React from 'react';
import { FlatList, Text, View, RefreshControl } from 'react-native';
import { VideoCard } from '../VideoCard/VideoCard';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

type VerticalListProps = {
  videos: ApiVideo[];
  numColumns?: number;
  refreshing?: boolean;
  isContinueWatching?: boolean;
  onRefresh?: () => void;
  onPressVideo?: (video: ApiVideo) => void;
  onDeleteVideo?: (video: ApiVideo) => void;
  emptyText?: string;
  HeaderComponent?: React.ReactElement;
  FooterComponent?: React.ReactElement;
};

export function VerticalList({
  videos,
  numColumns = 2,
  refreshing = false,
  isContinueWatching = false,
  onRefresh,
  onPressVideo,
  onDeleteVideo,
  emptyText = 'No videos found.',
  HeaderComponent,
  FooterComponent,
}: VerticalListProps) {
  return (
    <FlatList
      data={videos}
      keyExtractor={(item, index) => `vlist-${item.id}-${index}`}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={HeaderComponent}
      ListFooterComponent={FooterComponent}
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
          video={item}
          id={String(item.id)}
          title={item.title}
          thumbnailUrl={item.main_thumbnail_url || undefined}
          category={item.category || undefined}
          views={item.views != null ? `${item.views} views` : undefined}
          durationText={item.duration || undefined}
          badgeText={item.status}
          isContinueWatching={isContinueWatching}
          onPress={() => onPressVideo && onPressVideo(item)}
          onDelete={onDeleteVideo ? () => onDeleteVideo(item) : undefined}
        />
      )}
    />
  );
}
