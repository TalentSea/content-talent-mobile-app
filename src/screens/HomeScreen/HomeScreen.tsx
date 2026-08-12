import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth0 } from 'react-native-auth0';
import { User, Search } from 'lucide-react-native';

import { HeroBanner } from '../../components/HeroBanner';
import { HorizontalList } from '../../components/HorizontalList';
import { BottomNavBar } from '../../components/BottomNavBar';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { fetchPlaylists, PlaylistListItem } from '../../services/api/playlistApi';
import { styles } from './styles';

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth0();
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  const {
    popularVideos,
    loading,
    error,
  } = useVideos();

  const {
    playingVideo,
    playerLoading,
    playbackError,
    autoplay,
    hasNextVideo,
    setAutoplay,
    playVideo,
    handleVideoEnd,
    closePlayer,
  } = useVideoPlayback(popularVideos);

  useEffect(() => {
    async function loadLivePlaylists() {
      try {
        const response = await fetchPlaylists(undefined, 1, 10);
        setPlaylists(response.items || []);
      } catch (err) {
        console.warn('[HomeScreen] Error loading live playlists:', err);
      } finally {
        setPlaylistsLoading(false);
      }
    }
    loadLivePlaylists();
  }, []);

  const featuredVideo = popularVideos[0] || null;
  const continueWatchingVideos = popularVideos.slice(0, 3);
  const recentlyAddedVideos = popularVideos.slice(1);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Streamlined Top Header: Logo + Search + Profile strictly */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Streamr</Text>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate('Search')}
              style={styles.headerButton}
            >
              <Search color="#FFFFFF" size={20} />
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

        {/* Hero Featured Video Banner */}
        {featuredVideo ? (
          <HeroBanner video={featuredVideo} onPlay={playVideo} />
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading videos...</Text>
          </View>
        ) : null}

        {error || playbackError ? (
          <Text style={styles.errorText}>{error || playbackError}</Text>
        ) : null}

        {/* Row 1: Continue Watching */}
        <HorizontalList
          title="Continue Watching"
          videos={continueWatchingVideos}
          onPressVideo={playVideo}
          onSeeAll={() =>
            navigation.navigate('VideoGrid', { section: 'continue' })
          }
        />

        {/* Row 2: Popular Videos */}
        <HorizontalList
          title="Popular Videos"
          videos={popularVideos}
          onPressVideo={playVideo}
          onSeeAll={() =>
            navigation.navigate('VideoGrid', { section: 'popular' })
          }
        />

        {/* Row 3: Playlists (Horizontal HL Row) */}
        <View style={styles.playlistsRowContainer}>
          <View style={styles.playlistsRowHeader}>
            <Text style={styles.playlistsRowTitle}>Playlists</Text>
            <Pressable
              onPress={() => navigation.navigate('Playlist')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>

          {playlistsLoading ? (
            <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 10 }} />
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={item => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playlistsListContent}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.playlistCard}
                  onPress={() =>
                    navigation.navigate('CategoryDetail', {
                      category: item.name,
                      playlistId: item.id,
                    })
                  }
                >
                  <Image
                    source={{
                      uri:
                        item.thumbnail_url ||
                        'https://via.placeholder.com/400x200/1E1E2E/FFFFFF?text=Playlist',
                    }}
                    style={styles.playlistCardImage}
                  />
                  <View style={styles.playlistCardOverlay}>
                    <Text style={styles.playlistCardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.playlistCardMeta}>
                      {item.video_count} Videos
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>

        {/* Row 4: Recently Added */}
        <HorizontalList
          title="Recently Added"
          videos={recentlyAddedVideos}
          onPressVideo={playVideo}
          onSeeAll={() =>
            navigation.navigate('VideoGrid', { section: 'recent' })
          }
        />
      </ScrollView>

      {/* Permanent Bottom Navigation Bar */}
      <BottomNavBar activeTab="Home" navigation={navigation} />

      {/* Video Details Player Modal */}
      <PlayerModal
        playingVideo={playingVideo}
        autoplay={autoplay}
        hasNextVideo={hasNextVideo}
        onToggleAutoplay={() => setAutoplay(prev => !prev)}
        onVideoEnd={handleVideoEnd}
        onClose={closePlayer}
      />

      {playerLoading ? (
        <View style={styles.playerLoading}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}