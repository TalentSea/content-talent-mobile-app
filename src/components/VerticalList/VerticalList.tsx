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
  scrollable?: boolean;
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
  scrollable = true,
}: VerticalListProps) {
  if (!scrollable) {
    if (!videos || videos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      );
    }

    return (
      <View style={styles.listContent}>
        {HeaderComponent}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {videos.map((item, index) => (
            <View
              key={`vlist-static-${item.id}-${index}`}
              style={{ width: numColumns > 1 ? '48%' : '100%', marginBottom: 12 }}
            >
              <VideoCard
                video={item}
                id={String(item.id)}
                title={item.title}
                thumbnailUrl={item.main_thumbnail_url || undefined}
                category={item.category || undefined}
                durationText={item.duration || undefined}
                badgeText={item.status}
                isContinueWatching={isContinueWatching}
                onPress={() => onPressVideo && onPressVideo(item)}
                onDelete={onDeleteVideo ? () => onDeleteVideo(item) : undefined}
              />
            </View>
          ))}
        </View>
        {FooterComponent}
      </View>
    );
  }

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
          durationText={item.duration || undefined}
          badgeText={item.status}
          isContinueWatching={isContinueWatching}
          layout={numColumns === 1 ? 'row' : 'grid'}
          onPress={() => onPressVideo && onPressVideo(item)}
          onDelete={onDeleteVideo ? () => onDeleteVideo(item) : undefined}
        />
      )}
    />
  );
}
