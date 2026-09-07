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
import { fetchMobileBrandingApi, fetchMobileBannersApi, MobileBrandingResponse, MobileBannerItem } from '../../services/api/brandingApi';
import { getCurrentUser } from '../../services/api/authService';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import type { ApiVideo } from '../../types/video';
import { getCleanViewCountForVideo } from '../../services/viewTracker';
import { styles } from './styles';

export function HomeScreen({ navigation }: any) {
  const user = getCurrentUser();
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [branding, setBranding] = useState<MobileBrandingResponse | null>(null);
  const [apiBanners, setApiBanners] = useState<MobileBannerItem[]>([]);

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
        const [playlistsRes, categoriesRes, brandingRes, bannersRes] = await Promise.allSettled([
          fetchPlaylists(undefined, 1, 10),
          fetchUserCategoriesApi(),
          fetchMobileBrandingApi(),
          fetchMobileBannersApi(),
        ]);

        if (playlistsRes.status === 'fulfilled' && playlistsRes.value?.items) {
          setPlaylists(playlistsRes.value.items);
        }

        if (brandingRes.status === 'fulfilled' && brandingRes.value) {
          setBranding(brandingRes.value);
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
  }, [videos]);

  // 1. Recently Added: sorted by latest published_at/created_at timestamp
  const recentlyAddedVideos = [...videos].sort((a, b) => {
    const timeA = new Date(a.published_at || a.created_at || 0).getTime();
    const timeB = new Date(b.published_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  // 2. Popular Videos: sorted by highest views engagement
  const popularVideosSorted = [...videos].sort((a, b) => getCleanViewCountForVideo(b.id) - getCleanViewCountForVideo(a.id));

  // 3. Continue Watching: watch history filtered to available videos
  const continueWatchingList = continueWatching;

  // Extract custom featured banners configured in studio branding
  const combinedBanners: MobileBannerItem[] = [
    ...(branding?.featured_videos || []),
    ...apiBanners,
  ];

  // Deduplicate featured videos by ID or title
  let featuredBannersList = combinedBanners.filter((item, index, self) =>
    index === self.findIndex(t => (
      (t.video_id && item.video_id && Number(t.video_id) === Number(item.video_id)) ||
      (t.title && item.title && t.title.trim().toLowerCase() === item.title.trim().toLowerCase())
    ))
  );

  // If API banners list is empty, take the featured/primary uploaded video (e.g. Katniss edit) as featured video
  if (featuredBannersList.length === 0 && videos.length > 0) {
    const explicitlyFeatured = videos.filter(v => (v as any).is_featured || (v as any).featured || (v as any).is_banner);
    const targetVideos = explicitlyFeatured.length > 0 ? explicitlyFeatured : videos.slice(0, 1);
    featuredBannersList = targetVideos.map(v => ({
      id: v.id,
      video_id: v.id,
      title: v.title,
      description: v.description || '',
      image_url: getThumbnailForVideo(v),
      category: v.category || undefined,
    }));
  }

  // Build Hero Banner Carousel items strictly from live featured banners configured by admin
  const heroItems: HeroItem[] = featuredBannersList.map((b, idx) => {
    const matchingVideo = videos.find(v => (
      (b.video_id && v.id === Number(b.video_id)) ||
      (b.title && b.title.trim() !== '' && v.title && v.title.trim().toLowerCase() === b.title.trim().toLowerCase())
    ));
    const thumb = (b.image_url && b.image_url.trim() !== '')
      ? b.image_url
      : (matchingVideo ? getThumbnailForVideo(matchingVideo) : '');

    const finalTitle = (b.title && b.title.trim() !== '' && b.title !== 'Featured Video')
      ? b.title
      : (matchingVideo?.title || 'Featured Stream');

    return {
      id: `hero_banner_${b.id || b.video_id || idx}`,
      type: 'video',
      title: finalTitle,
      description: b.description || matchingVideo?.description || '',
      thumbnail_url: thumb,
      category: b.category || matchingVideo?.category || 'Entertainment',
      badgeLabel: idx === 0 ? 'FEATURED' : 'SPOTLIGHT',
      creatorName: branding?.creator_name || undefined,
      creatorAvatar: branding?.logo_url || thumb,
      rawVideo: matchingVideo,
    };
  });

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
            branding={branding}
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
        onUpgradeSubscription={() => {
          closePlayer();
          navigation?.navigate('Subscription');
        }}
        onClose={closePlayer}
      />

    </SafeAreaView>
  );
}