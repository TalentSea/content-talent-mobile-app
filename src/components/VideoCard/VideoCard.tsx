import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import type { ApiVideo } from '../../../types/video';
import { styles } from './styles';

export function VideoCard({
    video,
    onPress,
    fullWidth = false,
}: {
    video: ApiVideo;
    onPress: () => void;
    fullWidth?: boolean;
}) {
    const category = video.category || 'Video';
    const tags = video.tags?.length ? video.tags.slice(0, 2).join(', ') : 'Streamr';
    const isReady = String(video.status).trim().toLowerCase() === 'ready';

    return (
        <Pressable
            style={[styles.card, fullWidth ? styles.cardFullWidth : null]}
            onPress={onPress}
        >
            <View
                style={[
                    styles.thumbnailWrap,
                    fullWidth ? styles.thumbnailWrapFullWidth : null,
                ]}
            >
                <Image
                    source={{
                        uri:
                            video.thumbnail_url ||
                            'https://via.placeholder.com/400x240?text=No+Thumbnail',
                    }}
                    style={styles.thumbnail}
                />

                <View style={styles.playBadge}>
                    <Text style={styles.playIcon}>{isReady ? '▶' : '…'}</Text>
                </View>

                {!isReady ? (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{video.status}</Text>
                    </View>
                ) : null}
            </View>

            <Text numberOfLines={1} style={styles.videoTitle}>
                {video.title}
            </Text>

            <View style={styles.metaRow}>
                <Text numberOfLines={1} style={styles.category}>
                    {category}
                </Text>
                <Text style={styles.dot}>•</Text>
                <Text numberOfLines={1} style={styles.meta}>
                    {tags}
                </Text>
            </View>
        </Pressable>
    );
}