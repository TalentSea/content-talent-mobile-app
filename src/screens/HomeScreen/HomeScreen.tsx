import React from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StatusBar,
    Text,
    Pressable,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth0 } from 'react-native-auth0';
import { User } from 'lucide-react-native';

import { VideoSection } from '../../components/VideoSection';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { styles } from './styles';

export function HomeScreen({ navigation }: any) {
    const { user } = useAuth0();
    const {
        popularVideos,
        processingVideos,
        loading,
        error,
        reload,
    } = useVideos();

    const {
        playingVideo,
        playerLoading,
        playbackError,
        playVideo,
        closePlayer,
    } = useVideoPlayback();

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="light-content" />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.appTitle}>Streamr</Text>

                    <View style={styles.headerActions}>
                        <Pressable onPress={() => reload()} style={styles.headerButton}>
                            <Text style={styles.refreshText}>Refresh</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => navigation.navigate('Profile')}
                            style={styles.profileButton}
                        >
                            {user?.picture ? (
                                <Image source={{ uri: user.picture }} style={styles.avatarMini} />
                            ) : (
                                <User color="#FFFFFF" size={18} />
                            )}
                        </Pressable>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color="#FFFFFF" />
                        <Text style={styles.loadingText}>Loading videos...</Text>
                    </View>
                ) : null}

                {error || playbackError ? (
                    <Text style={styles.errorText}>{error || playbackError}</Text>
                ) : null}

                <VideoSection
                    title="Popular Videos"
                    videos={popularVideos}
                    onPressVideo={playVideo}
                    onSeeAll={() => navigation.navigate('VideoGrid', { section: 'popular' })}
                />

                <VideoSection
                    title="Processing"
                    videos={processingVideos}
                    onPressVideo={playVideo}
                    onSeeAll={() => navigation.navigate('VideoGrid', { section: 'processing' })}
                    emptyText="No processing videos."
                />
            </ScrollView>

            <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />

            {playerLoading ? (
                <View style={styles.playerLoading}>
                    <ActivityIndicator color="#FFFFFF" />
                </View>
            ) : null}
        </SafeAreaView>
    );
}