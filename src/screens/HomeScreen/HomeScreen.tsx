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

import { HeroBanner, HeroItem } from '../../components/HeroBanner';
import { HorizontalList } from '../../components/HorizontalList';
import { BottomNavBar } from '../../components/BottomNavBar';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { fetchPlaylists, PlaylistListItem } from '../../services/api/playlistApi';
import { fetchUserCategoriesApi, MobileCategoryItem } from '../../services/api/userActivityApi';
import { getCurrentUser } from '../../services/api/authService';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

export function HomeScreen({ navigation }: any) {
  const user = getCurrentUser();
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [apiCategories, setApiCategories] = useState<string[]>([]);

  const {
    videos,
    loading,
    reload,
  } = useVideos();

  const { continueWatching } = useWatchHistory();

  const {
    playingVideo,
    playVideo,
    closePlayer,
  } = useVideoPlayback(videos);

  useEffect(() => {
    async function loadLiveMobileData() {
      try {
        const [playlistsRes, categoriesRes] = await Promise.allSettled([
          fetchPlaylists(undefined, 1, 10),
          fetchUserCategoriesApi(),
        ]);

        if (playlistsRes.status === 'fulfilled' && playlistsRes.value?.items) {
          setPlaylists(playlistsRes.value.items);
        }

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value && categoriesRes.value.length > 0) {
          const catNames = categoriesRes.value.map((c: MobileCategoryItem) => c.name);
          setApiCategories(Array.from(new Set(catNames)));
        } else {
          // If API categories list is empty, derive directly from live backend videos
          const videoCats = Array.from(new Set(videos.map(v => v.category).filter(Boolean) as string[]));
          setApiCategories(videoCats);
        }
      } catch (err) {
        console.warn('[HomeScreen] Error loading live mobile data:', err);
      } finally {
        setPlaylistsLoading(false);
      }
    }
    loadLiveMobileData();
  }, [videos]);

  // 1. Recently Added: sorted by latest published_at/created_at timestamp
  const recentlyAddedVideos = [...videos].sort((a, b) => {
    const timeA = new Date(a.published_at || a.created_at || 0).getTime();
    const timeB = new Date(b.published_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  // 2. Popular Videos: sorted by highest views engagement
  const popularVideosSorted = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));

  // 3. Continue Watching: watch history
  const continueWatchingList = continueWatching.length > 0
    ? continueWatching
    : videos.slice(0, 3);

  // Multi-item Pluralsight Hero Banners from live videos
  const heroItems: HeroItem[] = [
    {
      id: 'creator_overview_1',
      type: 'video',
      title: 'Alex OTT Creator • Instructor Profile',
      description: 'Senior Mobile Architect leading masterclasses in React Native, HLS Video Streaming, and Microservices.',
      thumbnail_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      category: 'Creator Profile',
      badgeLabel: 'CREATOR SPOTLIGHT',
      duration: 'Instructor',
      creatorName: 'Alex OTT Creator',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      rawVideo: videos[0],
    },
    {
      id: 'segment_1',
      type: 'video',
      title: 'React Native Architecture & Performance Masterclass',
      description: 'Segment #1: Fabric renderer, TurboModules, and zero-bridge native execution.',
      thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      category: 'Development',
      badgeLabel: 'PLURALSIGHT PATH',
      duration: '22:15',
      creatorName: 'Alex OTT Creator',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      rawVideo: videos.find(v => v.id === 5) || videos[0],
    },
    {
      id: 'segment_2',
      type: 'trailer',
      title: 'Tears of Steel - Official Sci-Fi Open Movie Segment',
      description: 'Segment #2: High-octane HLS stream preview featuring embedded subtitle track switching.',
      thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      category: 'Sci-Fi',
      badgeLabel: 'FEATURED CLIP',
      duration: '12:14',
      creatorName: 'Alex OTT Creator',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      rawVideo: videos.find(v => v.id === 1) || videos[0],
    },
  ];

  function handleSelectPlaylist(playlistId: number, playlistTitle: string) {
    navigation.navigate('CategoryDetail', {
      playlistId,
      category: playlistTitle,
    });
  }

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

        {/* Multi-Item Pluralsight Hero Banner Section */}
        {!loading && (
          <HeroBanner
            heroItems={heroItems}
            onPlayVideo={playVideo}
            onSelectPlaylist={handleSelectPlaylist}
          />
        )}

        {/* Video Horizontal Carousels in EXACT requested order: */}
        {/* 1. Continue Watching */}
        {/* 2. Popular Videos */}
        {/* 3. Playlists */}
        {/* 4. Recently Updated */}
        {/* 5. Category-Wise Videos */}
        {!loading && (
          <View style={{ marginTop: 4 }}>
            {/* 1. Continue Watching Section */}
            {continueWatchingList.length > 0 && (
              <HorizontalList
                title="Continue Watching"
                videos={continueWatchingList}
                onPressVideo={playVideo}
              />
            )}

            {/* 2. Popular Videos Section */}
            {popularVideosSorted.length > 0 && (
              <HorizontalList
                title="Popular Videos 🔥"
                videos={popularVideosSorted}
                onPressVideo={playVideo}
                onSeeAll={() => navigation.navigate('VideoGrid', { section: 'popular' })}
              />
            )}

            {/* 3. Playlists Section */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ paddingHorizontal: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Playlists</Text>
                <Pressable onPress={() => navigation.navigate('Playlist')}>
                  <Text style={{ fontSize: 12, color: '#E50914', fontWeight: '600' }}>See all</Text>
                </Pressable>
              </View>

              {playlistsLoading ? (
                <ActivityIndicator color="#E50914" style={{ marginVertical: 20 }} />
              ) : playlists.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={playlists}
                  keyExtractor={(item, index) => `home-pl-${item.id}-${index}`}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.playlistCard}
                      onPress={() => handleSelectPlaylist(item.id, item.name || 'Playlist')}
                    >
                      <View style={{ position: 'relative' }}>
                        <Image
                          source={{ uri: item.thumbnail_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80' }}
                          style={{ width: 140, height: 80, borderRadius: 8, backgroundColor: '#1E1E2E' }}
                        />
                        <View style={{
                          position: 'absolute',
                          bottom: 6,
                          right: 6,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          borderWidth: 0.5,
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                            {item.video_count || 0} Videos
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.playlistsRowTitle} numberOfLines={1}>
                        {item.name || item.description || `Playlist`}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {item.description || `${item.video_count || 0} Streams`}
                      </Text>
                    </Pressable>
                  )}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                />
              ) : (
                <Text style={{ color: '#9CA3AF', fontSize: 13, paddingHorizontal: 16 }}>No playlists available</Text>
              )}
            </View>

            {/* 4. Recently Updated / Recently Added Section */}
            {recentlyAddedVideos.length > 0 && (
              <HorizontalList
                title="Recently Updated"
                videos={recentlyAddedVideos}
                onPressVideo={playVideo}
                onSeeAll={() => navigation.navigate('VideoGrid', { section: 'recent' })}
              />
            )}

            {/* 5. Category-Wise Video Rows using API categories ONLY */}
            {apiCategories.map(cat => {
              const catVideos = videos.filter(v => v.category?.toLowerCase() === cat.toLowerCase());
              if (catVideos.length === 0) return null;
              return (
                <HorizontalList
                  key={cat}
                  title={`${cat} Streams`}
                  videos={catVideos}
                  onPressVideo={playVideo}
                  onSeeAll={() => navigation.navigate('CategoryDetail', { category: cat })}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Permanent Bottom Navigation Bar */}
      <BottomNavBar activeTab="Home" navigation={navigation} />

      {/* Embedded HLS Video Player Modal */}
      <PlayerModal
        playingVideo={playingVideo}
        onSelectVideo={playVideo}
        onSelectPlaylist={(p) => handleSelectPlaylist(p.id, p.name)}
        onClose={closePlayer}
      />
    </SafeAreaView>
  );
}