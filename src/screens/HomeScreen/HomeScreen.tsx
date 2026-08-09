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
import { User, Search } from 'lucide-react-native';

import { HeroBanner } from '../../components/HeroBanner';
import { HorizontalList } from '../../components/HorizontalList';
import { BottomNavBar } from '../../components/BottomNavBar';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { fetchPlaylists, PlaylistListItem } from '../../services/api/playlistApi';
import { getCurrentUser } from '../../services/api/authService';
import { styles } from './styles';

export function HomeScreen({ navigation }: any) {
  const user = getCurrentUser();
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

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
        {/* Top Header: Logo + Search + Profile */}
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
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarMini} />
              ) : (
                <User color="#FFFFFF" size={18} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#E50914" />
          </View>
        )}

        {/* Hero Banner Section */}
        {featuredVideo && !loading && (
          <HeroBanner
            video={featuredVideo}
            onPlay={() => playVideo(featuredVideo)}
          />
        )}

        {/* Video Horizontal Carousels */}
        {!loading && (
          <View style={{ marginTop: 12 }}>
            {/* Live Playlists Carousel */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Featured Playlists</Text>
              </View>

              {playlistsLoading ? (
                <ActivityIndicator color="#E50914" style={{ marginVertical: 20 }} />
              ) : playlists.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={playlists}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.playlistCard}
                      onPress={() => navigation.navigate('Playlist', { playlistId: item.id, playlistTitle: item.name || item.description || 'Playlist' })}
                    >
                      <Image
                        source={{ uri: item.thumbnail_url || 'https://via.placeholder.com/300x160/1E1E2E/FFFFFF?text=Playlist' }}
                        style={{ width: 140, height: 80, borderRadius: 8, backgroundColor: '#1E1E2E' }}
                      />
                      <Text style={styles.playlistsRowTitle} numberOfLines={1}>
                        {item.name || item.description || `Playlist #${item.id}`}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {item.video_count || 0} Videos
                      </Text>
                    </Pressable>
                  )}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                />
              ) : (
                <Text style={{ color: '#9CA3AF', fontSize: 13, paddingHorizontal: 16 }}>No playlists available</Text>
              )}
            </View>

            {/* Continue Watching Section */}
            {continueWatchingVideos.length > 0 && (
              <HorizontalList
                title="Continue Watching"
                videos={continueWatchingVideos}
                onPressVideo={playVideo}
              />
            )}

            {/* Recently Added Section */}
            {recentlyAddedVideos.length > 0 && (
              <HorizontalList
                title="Recently Added"
                videos={recentlyAddedVideos}
                onPressVideo={playVideo}
                onSeeAll={() => navigation.navigate('Categories')}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Permanent Bottom Navigation Bar */}
      <BottomNavBar activeTab="Home" navigation={navigation} />

      {/* Embedded HLS Video Player Modal */}
      <PlayerModal
        playingVideo={playingVideo}
        onClose={closePlayer}
      />
    </SafeAreaView>
  );
}