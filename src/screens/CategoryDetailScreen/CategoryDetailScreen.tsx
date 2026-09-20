import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Play,
  Bookmark,
  Shuffle,
  Share2,
  Download,
} from 'lucide-react-native';

import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useUserActivity } from '../../hooks/useUserActivity';
import { useDownloads } from '../../hooks/useDownloads';
import {
  fetchPlaylistDetails,
  fetchPlaylistVideos,
  PlaylistDetails,
  PlaylistListItem,
} from '../../services/api/playlistApi';
import { normalizeVideoItem } from '../../services/api/video';
import type { ApiVideo } from '../../types/video';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import { getCleanViewCountForVideo } from '../../services/viewTracker';
import { formatViews, getRelativeTimeString, formatDurationString, formatExactDateString } from '../../utils/timeUtils';
import { styles } from './styles';

export function CategoryDetailScreen({ route, navigation }: any) {
  const { category: initialCategory = 'All', playlistId, description: routeDescription } = route.params || {};

  const { popularVideos, reload } = useVideos();
  const [playlistDetails, setPlaylistDetails] = useState<PlaylistDetails | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(!!playlistId);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const categoryFallbackVideos = popularVideos.filter(
    v =>
      v.category?.toLowerCase() === initialCategory.toLowerCase() ||
      (playlistDetails?.name && v.category?.toLowerCase() === playlistDetails.name.toLowerCase()),
  );

  const finalVideos = playlistId
    ? playlistVideos.length > 0
      ? playlistVideos
      : categoryFallbackVideos.length > 0
        ? categoryFallbackVideos
        : popularVideos
    : categoryFallbackVideos.length > 0
      ? categoryFallbackVideos
      : popularVideos;

  const { playingVideo, playVideo, closePlayer, handleVideoEnd, autoplay, setAutoplay } = useVideoPlayback(finalVideos);
  const { toggleSavePlaylist, isPlaylistSaved } = useUserActivity();
  const { downloadVideoInApp } = useDownloads();
  const [isSaved, setIsSaved] = useState(playlistId ? isPlaylistSaved(playlistId) : false);

  useEffect(() => {
    if (playlistId) {
      setIsSaved(isPlaylistSaved(playlistId));
      async function loadPlaylistData() {
        try {
          const details = await fetchPlaylistDetails(playlistId);
          setPlaylistDetails(details);

          const videosRes = await fetchPlaylistVideos(playlistId);

          const rawDetailsList = Array.isArray((details?.videos as any)?.items)
            ? (details.videos as any).items
            : Array.isArray(details?.videos)
              ? details.videos
              : Array.isArray((details as any)?.items)
                ? (details as any).items
                : [];

          const rawApiList = videosRes?.items || [];

          const combinedMap = new Map<number, ApiVideo>();
          [...rawDetailsList, ...rawApiList].forEach((v: any) => {
            if (v && v.id) {
              combinedMap.set(v.id, normalizeVideoItem(v));
            }
          });

          let items = Array.from(combinedMap.values());
          setPlaylistVideos(items);
        } catch (error) {
          console.warn('[CategoryDetailScreen] Error loading playlist details:', error);
        } finally {
          setLoading(false);
        }
      }
      loadPlaylistData();
    }
  }, [playlistId]);

  const displayTitle = playlistDetails?.name || initialCategory;
  const displayCategory = playlistDetails?.name || (initialCategory !== 'All' ? initialCategory : 'Playlist');
  const heroDescription = playlistDetails?.description || routeDescription || '';

  const heroThumb =
    playlistDetails?.thumbnail_url ||
    (finalVideos[0] ? getThumbnailForVideo(finalVideos[0]) : '');

  function handlePlayAll(shuffle = false) {
    if (finalVideos.length > 0) {
      let queueList = [...finalVideos];
      if (shuffle) {
        queueList.sort(() => Math.random() - 0.5);
      }
      playVideo(queueList[0]);
    }
  }

  function handleToggleSave() {
    const targetId = playlistId || 1;
    const nowSaved = toggleSavePlaylist(targetId, displayTitle);
    setIsSaved(nowSaved);
  }

  function handleShare() {
    Share.share({
      title: displayTitle,
      message: `Check out playlist "${displayTitle}" on Streamr!`,
    }).catch(() => { });
  }

  function handleSelectPlaylist(playlist: PlaylistListItem) {
    navigation.push('CategoryDetail', {
      category: playlist.name,
      playlistId: playlist.id,
    });
  }

  const rawPlaylistDate = playlistDetails?.created_at || route.params?.createdAt || route.params?.created_at || null;
  const playlistAge = getRelativeTimeString(rawPlaylistDate);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await reload();
              setRefreshing(false);
            }}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* Top Hero Banner Header */}
        <View style={styles.heroBannerContainer}>
          {heroThumb ? (
            <Image source={{ uri: heroThumb }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: '#1E1E2E' }]} />
          )}
          <View style={styles.heroOverlay}>
            <Pressable
              style={styles.backButtonFloating}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft color="#FFFFFF" size={22} />
            </Pressable>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {displayTitle}
              </Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.videoCountBadge}>
                  <Text style={styles.videoCountBadgeText}>
                    {finalVideos.length} {finalVideos.length === 1 ? 'video' : 'videos'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Vertical Video List */}
        <View style={{ paddingTop: 12, paddingBottom: 30 }}>
          {loading ? (
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginVertical: 30 }}>
              Loading videos...
            </Text>
          ) : finalVideos.length === 0 ? (
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginVertical: 30 }}>
              No videos in this category yet.
            </Text>
          ) : (
            finalVideos.map((item, index) => {
              const itemThumb = getThumbnailForVideo(item);
              const formattedDuration = formatDurationString(item.duration);
              const itemCat = item.category || displayCategory;
              return (
                <Pressable
                  key={`cat-item-${item.id}-${index}`}
                  style={styles.playlistItemRow}
                  onPress={() => playVideo(item)}
                >
                  <View style={styles.itemThumbWrap}>
                    <Image source={{ uri: itemThumb }} style={styles.itemThumb} />
                    {formattedDuration ? (
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationBadgeText}>{formattedDuration}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      {itemCat && itemCat !== 'All' && itemCat !== 'Playlist' ? (
                        <>
                          <Text style={styles.categoryTagRed}>{itemCat}</Text>
                          <Text style={styles.dotMeta}>•</Text>
                        </>
                      ) : null}
                      <Text style={styles.itemMetaText}>{formatViews(item.views)}</Text>
                      <Text style={styles.dotMeta}>•</Text>
                      <Text style={styles.itemMetaText}>
                        {getRelativeTimeString(item.published_at || item.created_at)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Video Player Modal with Continuous Autoplay Advancement */}
      <PlayerModal
        playingVideo={playingVideo}
        autoplay={autoplay}
        onToggleAutoplay={() => setAutoplay(prev => !prev)}
        onVideoEnd={handleVideoEnd}
        onSelectVideo={playVideo}
        onSelectPlaylist={handleSelectPlaylist}
        onUpgradeSubscription={() => {
          closePlayer();
          navigation?.navigate('Subscription');
        }}
        onClose={closePlayer}
      />
    </SafeAreaView>
  );
}

