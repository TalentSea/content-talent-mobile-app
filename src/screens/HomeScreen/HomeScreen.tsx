import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
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
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { fetchPlaylists, PlaylistListItem } from '../../services/api/playlistApi';
import { fetchCategoriesApi, MobileCategoryItem } from '../../services/api/categoriesApi';
import { fetchFeaturedVideosApi, FeaturedVideo } from '../../services/api/featuredVideosApi';
import { getCurrentUser } from '../../services/api/authService';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import type { ApiVideo } from '../../types/video';
import { getCleanViewCountForVideo } from '../../services/viewTracker';
import { HeroSkeleton, HorizontalRowSkeleton } from '../../components/SkeletonLoader/HotstarSkeleton';
import { useAppTheme } from '../../context/ThemeContext';
import { styles } from './styles';

export function HomeScreen({ navigation }: any) {
  const user = getCurrentUser();
  const { theme, branding } = useAppTheme();
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [apiBanners, setApiBanners] = useState<FeaturedVideo[]>([]);

  const {
    videos,
    loading,
    reload,
  } = useVideos();

  const { continueWatching } = useWatchHistory(videos);

  const {
    playingVideo,
    playVideo,
    closePlayer,
  } = useVideoPlayback(videos);

  useEffect(() => {
    async function loadLiveMobileData() {
      try {
        // Branding and theme are already pre-fetched during bootstrap.
        // Fetch playlists, categories, and banners here:
        const [playlistsRes, categoriesRes, bannersRes] = await Promise.allSettled([
          fetchPlaylists(undefined, 1, 10),
          fetchCategoriesApi(),
          fetchFeaturedVideosApi(),
        ]);

        if (playlistsRes.status === 'fulfilled' && playlistsRes.value?.items && playlistsRes.value.items.length > 0) {
          setPlaylists(playlistsRes.value.items);
        } else if (videos.length > 0) {
          const categories = Array.from(new Set(videos.map(v => v.category).filter(Boolean) as string[]));
          const derivedPlaylists: PlaylistListItem[] = categories.map((cat, idx) => {
            const catVideos = videos.filter(v => v.category?.toLowerCase() === cat.toLowerCase());
            const firstVideo = catVideos[0];
            return {
              id: idx + 100,
              name: cat,
              description: `${catVideos.length} ${catVideos.length === 1 ? 'Video' : 'Videos'}`,
              thumbnail_url: firstVideo ? getThumbnailForVideo(firstVideo) : null,
              video_count: catVideos.length,
              created_at: firstVideo?.published_at || firstVideo?.created_at || null,
            };
          });
          setPlaylists(derivedPlaylists);
        }

        if (bannersRes.status === 'fulfilled' && bannersRes.value && bannersRes.value.length > 0) {
          setApiBanners(bannersRes.value);
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
  }, [videos.length]);

  // Max video count limits per section:
  // 1. Recently Added: up to 15 videos
  const recentlyAddedVideos = [...videos].sort((a, b) => {
    const timeA = new Date(a.published_at || a.created_at || 0).getTime();
    const timeB = new Date(b.published_at || b.created_at || 0).getTime();
    return timeB - timeA;
  }).slice(0, 15);

  // 2. Popular Videos: up to 15 videos
  const popularVideosSorted = [...videos]
    .sort((a, b) => getCleanViewCountForVideo(b.id) - getCleanViewCountForVideo(a.id))
    .slice(0, 15);

  // 3. Continue Watching: up to 10 started videos
  const continueWatchingList = continueWatching.slice(0, 10);

  // Build Hero Banner Carousel items directly from the backend featured videos response
  const heroItems: HeroItem[] = apiBanners.map((b, idx) => {
    const matchingVideo = videos.find(v => v.id === b.id);

    return {
      id: `hero_banner_${b.id}_${idx}`,
      type: 'video',
      title: b.title,
      description: b.description || matchingVideo?.description || '',
      thumbnail_url: b.main_thumbnail_url || (matchingVideo ? getThumbnailForVideo(matchingVideo) : ''),
      category: b.category || matchingVideo?.category || 'Entertainment',
      badgeLabel: idx === 0 ? 'FEATURED' : 'SPOTLIGHT',
      creatorName: branding?.studio_name || branding?.creator_name || undefined,
      creatorAvatar: branding?.logo_url || b.main_thumbnail_url || undefined,
      rawVideo: matchingVideo,
    };
  });

  function handleSelectPlaylist(playlistId: number, playlistTitle: string) {
    navigation.navigate('PlaylistDetail', {
      playlistId,
      category: playlistTitle,
    });
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.mainBackgroundColor }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={reload}
            tintColor={theme.primaryColor}
          />
        }
      >
        {/* Top Header: Logo + Search + Profile */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
            {branding?.logo_url ? (
              <Image source={{ uri: branding.logo_url }} style={{ width: 28, height: 28, borderRadius: 6 }} resizeMode="contain" />
            ) : null}
            <Text style={[styles.appTitle, { color: theme.primaryTextColor }]} numberOfLines={1}>
              {branding?.studio_name || branding?.creator_name || 'Streamr'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate('Search')}
              style={styles.headerButton}
            >
              <Search color={theme.primaryTextColor} size={20} />
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('ProfileTab' as any)}
              style={[styles.profileButton, { backgroundColor: theme.cardBackgroundColor }]}
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarMini} />
              ) : (
                <User color={theme.primaryTextColor} size={18} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Loading Indicator with Hotstar Skeleton Shimmers */}
        {loading && (
          <View style={{ paddingTop: 8 }}>
            <HeroSkeleton />
            <HorizontalRowSkeleton titleWidth={160} />
            <HorizontalRowSkeleton titleWidth={130} />
          </View>
        )}

        {/* Multi-Item Pluralsight Hero Banner Section */}
        {!loading && (
          <HeroBanner
            heroItems={heroItems}
            branding={branding}
            onPlayVideo={playVideo}
            onSelectPlaylist={handleSelectPlaylist}
          />
        )}

        {/* Video Horizontal Carousels: */}
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
                title="Popular Videos"
                videos={popularVideosSorted}
                onPressVideo={playVideo}
                onSeeAll={() => navigation.navigate('VideoGrid', { section: 'popular' })}
              />
            )}

            {/* 3. Playlists Section */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ paddingHorizontal: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.primaryTextColor }}>Playlists</Text>
                <Pressable onPress={() => navigation.navigate('Playlist')}>
                  <Text style={{ fontSize: 12, color: theme.primaryColor, fontWeight: '600' }}>See all</Text>
                </Pressable>
              </View>

              {playlistsLoading ? (
                <ActivityIndicator color={theme.primaryColor} style={{ marginVertical: 20 }} />
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
                      <Image
                        source={{ uri: item.thumbnail_url || '' }}
                        style={[styles.playlistCardImage, { backgroundColor: theme.cardBackgroundColor }]}
                      />
                      <Text style={[styles.playlistCardTitle, { color: theme.primaryTextColor }]} numberOfLines={1}>
                        {item.name || item.description || `Playlist`}
                      </Text>
                      {item.description ? (
                        <Text style={[styles.playlistCardMeta, { color: theme.secondaryTextColor }]} numberOfLines={1}>
                          {item.description}
                        </Text>
                      ) : null}
                    </Pressable>
                  )}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                />
              ) : (
                <Text style={{ color: theme.mutedTextColor, fontSize: 13, paddingHorizontal: 16 }}>No playlists available</Text>
              )}
            </View>

            {/* 4. Recently Updated / Recently Added Section */}
            {recentlyAddedVideos.length > 0 && (
              <HorizontalList
                title="Recently Added"
                videos={recentlyAddedVideos}
                onPressVideo={playVideo}
                onSeeAll={() => navigation.navigate('VideoGrid', { section: 'recent' })}
              />
            )}

            {/* 5. Category-Wise Video Rows using API categories ONLY */}
            {apiCategories.map(cat => {
              const catVideos = videos.filter(v => v.category?.toLowerCase() === cat.toLowerCase()).slice(0, 15);
              if (catVideos.length === 0) return null;
              return (
                <HorizontalList
                  key={cat}
                  title={`${cat} Streams`}
                  videos={catVideos}
                  onPressVideo={playVideo}
                  onSeeAll={() => navigation.navigate('CategoriesTab' as any, { screen: 'Categories' } as any)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>


      {/* Embedded HLS Video Player Modal */}
      <PlayerModal
        playingVideo={playingVideo}
        onSelectVideo={playVideo}
        onSelectPlaylist={(p) => handleSelectPlaylist(p.id, p.name)}
        onUpgradeSubscription={() => {
          closePlayer();
          navigation?.navigate('ProfileTab' as any, { screen: 'Subscription' } as any);
        }}
        onClose={closePlayer}
      />

    </SafeAreaView>
  );
}