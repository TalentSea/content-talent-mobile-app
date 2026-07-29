import React from 'react';
import { FlatList, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VideoCard } from '../../components/VideoCard/VideoCard';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { styles } from './styles';

export function VideoGridScreen({ route, navigation }: any) {
    const { section } = route.params;

    const { popularVideos, processingVideos } = useVideos();
    const { playingVideo, playVideo, closePlayer } = useVideoPlayback();

    const isPopular = section === 'popular';
    const title = isPopular ? 'Popular Videos' : 'Processing';
    const videos = isPopular ? popularVideos : processingVideos;

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="light-content" />

            <View style={styles.expandedHeader}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    hitSlop={10}
                >
                    <Text style={styles.backIcon}>‹</Text>
                </Pressable>

                <Text style={styles.expandedTitle}>{title}</Text>
                <View style={styles.backButtonSpacer} />
            </View>

            {videos.length === 0 ? (
                <Text style={styles.emptyText}>No videos found.</Text>
            ) : (
                <FlatList
                    data={videos}
                    keyExtractor={item => String(item.id)}
                    numColumns={2}
                    columnWrapperStyle={styles.gridRow}
                    contentContainerStyle={styles.gridContent}
                    renderItem={({ item }) => (
                        <VideoCard video={item} onPress={() => playVideo(item)} fullWidth />
                    )}
                />
            )}

            <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />
        </SafeAreaView>
    );
}