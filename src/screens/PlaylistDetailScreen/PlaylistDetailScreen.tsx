import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
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
  Shuffle,
  Bookmark,
  Heart,
  Share2,
} from 'lucide-react-native';

import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useUserActivity } from '../../hooks/useUserActivity';
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
import { formatViews, getRelativeTimeString, formatDurationString } from '../../utils/timeUtils';
import { styles } from './styles';

export function PlaylistDetailScreen({ route, navigation }: any) {
  const { playlistId, category: initialCategory = 'Playlist', description: routeDescription } = route.params || {};

  const { popularVideos } = useVideos();
  const [playlistDetails, setPlaylistDetails] = useState<PlaylistDetails | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(!!playlistId);

  const categoryFallbackVideos = popularVideos.filter(
    v =>
      (v.category && v.category.toLowerCase() === initialCategory.toLowerCase()) ||
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
  const { toggleSavePlaylist, isPlaylistSaved, toggleLikePlaylist, isPlaylistLiked } = useUserActivity();

  const targetId = playlistId || initialCategory;
  const [isSaved, setIsSaved] = useState(isPlaylistSaved(targetId));
  const [isLiked, setIsLiked] = useState(isPlaylistLiked(targetId));

  useEffect(() => {
    setIsSaved(isPlaylistSaved(targetId));
    setIsLiked(isPlaylistLiked(targetId));
  }, [targetId]);

  useEffect(() => {
    if (playlistId) {
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
          console.warn('[PlaylistDetailScreen] Error loading playlist details:', error);
        } finally {
          setLoading(false);
        }
      }
      loadPlaylistData();
    }
  }, [playlistId]);

  const displayTitle = playlistDetails?.name || initialCategory;
  const displayCategoryTag = playlistDetails?.name || (initialCategory !== 'Playlist' ? initialCategory : 'Technology');
  const playlistDescription = playlistDetails?.description || routeDescription || '';

  const heroThumb =
    playlistDetails?.thumbnail_url ||
    (finalVideos[0] ? getThumbnailForVideo(finalVideos[0]) : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80');

  // Calculate total playlist views
  const totalPlaylistViews = finalVideos.reduce(
    (acc, v) => acc + getCleanViewCountForVideo(v.id),
    0,
  );

  const rawPlaylistDate = playlistDetails?.created_at || route.params?.createdAt || route.params?.created_at || (finalVideos[0] ? finalVideos[0].published_at || finalVideos[0].created_at : null);
  const playlistAge = getRelativeTimeString(rawPlaylistDate);

  function handlePlayAll(shuffle = false) {
    if (finalVideos.length > 0) {
      let queueList = [...finalVideos];
      if (shuffle) {
        queueList.sort(() => Math.random() - 0.5);
      }
      playVideo(queueList[0]);
    }
  }

  function handleToggleLike() {
    const nowLiked = toggleLikePlaylist(targetId, displayTitle, heroThumb);
    setIsLiked(nowLiked);
  }

  function handleToggleSave() {
    const nowSaved = toggleSavePlaylist(targetId, displayTitle, heroThumb);
    setIsSaved(nowSaved);
  }

  function handleShare() {
    Share.share({
      title: displayTitle,
      message: `Check out playlist "${displayTitle}" on Streamr!`,
    }).catch(() => { });
  }

  function handleSelectPlaylist(playlist: PlaylistListItem) {
    navigation.push('PlaylistDetail', {
      category: playlist.name,
      playlistId: playlist.id,
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Hero Banner Header */}
        <View style={styles.heroBannerContainer}>
          <Image source={{ uri: heroThumb }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <Pressable
              style={styles.backButtonFloating}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft color="#FFFFFF" size={22} />
            </Pressable>

            <View style={styles.heroContent}>
              <Text style={styles.playlistTagLabel}>PLAYLIST</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {displayTitle}
              </Text>

              <View style={styles.heroMetaRow}>
                {displayCategoryTag ? (
                  <View style={styles.categoryBadgeRed}>
                    <Text style={styles.categoryBadgeRedText}>{displayCategoryTag}</Text>
                  </View>
                ) : null}

                <Text style={styles.metaTextLight}>
                  {finalVideos.length} {finalVideos.length === 1 ? 'video' : 'videos'}
                </Text>
                <Text style={styles.dotMeta}>•</Text>
                <Text style={styles.metaTextLight}>
                  {formatViews(totalPlaylistViews || 2)}
                </Text>
                <Text style={styles.dotMeta}>•</Text>
                <Text style={styles.metaTextLight}>{playlistAge}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Controls Bar */}
        <View style={styles.actionBarRow}>
          <Pressable style={styles.playAllButton} onPress={() => handlePlayAll(false)}>
            <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
            <Text style={styles.playAllText}>Play All</Text>
          </Pressable>

          <Pressable style={styles.actionIconButton} onPress={() => handlePlayAll(true)}>
            <Shuffle color="#FFFFFF" size={16} />
            <Text style={styles.actionIconLabel}>Shuffle</Text>
          </Pressable>

          <Pressable style={styles.actionIconButton} onPress={handleToggleLike}>
            <Heart color={isLiked ? '#EF4444' : '#FFFFFF'} size={16} fill={isLiked ? '#EF4444' : 'transparent'} />
            <Text style={[styles.actionIconLabel, isLiked && { color: '#EF4444' }]}>{isLiked ? 'Liked' : 'Like'}</Text>
          </Pressable>

          <Pressable style={styles.actionIconButton} onPress={handleToggleSave}>
            <Bookmark color={isSaved ? '#3B82F6' : '#FFFFFF'} size={16} fill={isSaved ? '#3B82F6' : 'transparent'} />
            <Text style={[styles.actionIconLabel, isSaved && { color: '#3B82F6' }]}>{isSaved ? 'Saved' : 'Save'}</Text>
          </Pressable>

          <Pressable style={styles.iconOnlyButton} onPress={handleShare}>
            <Share2 color="#FFFFFF" size={16} />
          </Pressable>
        </View>

        {/* Playlist Description if present */}
        {playlistDescription ? (
          <View style={styles.playlistDescriptionContainer}>
            <Text style={styles.playlistDescriptionText}>{playlistDescription}</Text>
          </View>
        ) : null}

        {/* Section Header: Videos in this Playlist (X) */}
        <Text style={styles.sectionTitleHeader}>
          Videos in this Playlist ({finalVideos.length})
        </Text>

        {/* Vertical Video List */}
        <View style={{ paddingBottom: 30 }}>
          {loading ? (
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginVertical: 30 }}>
              Loading playlist videos...
            </Text>
          ) : finalVideos.length === 0 ? (
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginVertical: 30 }}>
              No videos in this playlist yet.
            </Text>
          ) : (
            finalVideos.map((item, index) => {
              const itemThumb = getThumbnailForVideo(item);
              const formattedDuration = formatDurationString(item.duration);
              const viewsStr = formatViews(item.views);
              const dateStr = getRelativeTimeString(item.published_at || item.created_at);

              return (
                <Pressable
                  key={`playlist-video-item-${item.id}-${index}`}
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
                      <Text style={styles.itemMetaText}>
                        {viewsStr}
                        {formattedDuration ? ` • ${formattedDuration}` : ''}
                        {dateStr ? ` • ${dateStr}` : ''}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Video Player Modal */}
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
