import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { VideoCard } from '../VideoCard';
import type { ApiVideo } from '../../../types/video';
import { styles } from './styles';

export function VideoSection({
    title,
    videos,
    onPressVideo,
    onSeeAll,
    emptyText = 'No videos found.',
}: {
    title: string;
    videos: ApiVideo[];
    onPressVideo: (video: ApiVideo) => void;
    onSeeAll: () => void;
    emptyText?: string;
}) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>

                {videos.length > 0 ? (
                    <Pressable onPress={onSeeAll} hitSlop={8}>
                        <Text style={styles.seeAll}>See all</Text>
                    </Pressable>
                ) : null}
            </View>

            {videos.length === 0 ? (
                <Text style={styles.emptyText}>{emptyText}</Text>
            ) : (
                <FlatList
                    horizontal
                    data={videos}
                    keyExtractor={item => String(item.id)}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.row}
                    renderItem={({ item }) => (
                        <VideoCard video={item} onPress={() => onPressVideo(item)} />
                    )}
                />
            )}
        </View>
    );
}