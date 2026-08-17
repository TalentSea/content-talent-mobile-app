import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Play,
  ThumbsUp,
  Heart,
  Download,
  ChevronDown,
  ChevronUp,
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
import type { ApiVideo } from '../../types/video';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import { getCleanViewCountForVideo } from '../../services/viewTracker';
import { formatViews, getRelativeTimeString } from '../../utils/timeUtils';
import { styles } from './styles';

export function CategoryDetailScreen({ route, navigation }: any) {
  const { category: initialCategory = 'All', playlistId } = route.params || {};

  const { popularVideos, loading: popularLoading, reload: popularReload } = useVideos();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(popularVideos);
  const { toggleLikeVideo, toggleSaveVideo, isVideoLiked, isVideoSaved } = useUserActivity();
  const { downloadVideoInApp } = useDownloads();

  const [playlistDetails, setPlaylistDetails] = useState<PlaylistDetails | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(!!playlistId);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(4200);

  useEffect(() => {
    if (playlistId) {
      async function loadPlaylistData() {
        try {
          const details = await fetchPlaylistDetails(playlistId);
          setPlaylistDetails(details);

          const videosRes = await fetchPlaylistVideos(playlistId);
          setPlaylistVideos(videosRes.items || []);
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
  const displayCategory = initialCategory !== 'All' ? initialCategory : 'Travel';
  const displaySubtitle =
    playlistDetails?.description ||
    `A curated collection of ${playlistVideos.length || 12} hand-picked videos in ${displayCategory}. Published recently.`;

  const displayVideos = playlistId
    ? playlistVideos.length > 0
      ? playlistVideos
      : popularVideos
    : popularVideos.filter(
        v => v.category?.toLowerCase() === initialCategory.toLowerCase(),
      );

  const finalVideos = displayVideos.length > 0 ? displayVideos : popularVideos;

  const heroThumb =
    playlistDetails?.thumbnail_url ||
    getThumbnailForVideo(finalVideos[0]);

  function handlePlayAll() {
    if (finalVideos.length > 0) {
      playVideo(finalVideos[0]);
    }
  }

  function handleToggleLike() {
    setIsLiked(prev => !prev);
    setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    if (finalVideos.length > 0) {
      toggleLikeVideo(finalVideos[0]);
    }
  }

  function handleToggleSave() {
    setIsSaved(prev => !prev);
    if (finalVideos.length > 0) {
      toggleSaveVideo(finalVideos[0]);
    }
  }

  function handleDownloadAll() {
    if (finalVideos.length > 0) {
      downloadVideoInApp(finalVideos[0]);
    }
  }

  function handleSelectPlaylist(playlist: PlaylistListItem) {
    navigation.push('CategoryDetail', {
      category: playlist.name,
      playlistId: playlist.id,
    });
  }

  const tagsList = ['#Travel', '#Adventure', '#Explore', '#World'];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Hero Banner Header matching screenshot */}
        <View style={styles.heroBannerContainer}>
          <Image source={{ uri: heroThumb }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <Pressable
              style={styles.backButtonFloating}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft color="#FFFFFF" size={24} />
            </Pressable>

            <View style={styles.heroContent}>
              <Text style={styles.playlistTag}>PLAYLIST</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {displayTitle}
              </Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{displayCategory}</Text>
                </View>
                <Text style={styles.heroMetaText}>{finalVideos.length} videos</Text>
                <Text style={styles.dotMeta}>•</Text>
                <Text style={styles.heroMetaText}>{formatViews(finalVideos.reduce((acc, v) => acc + (getCleanViewCountForVideo(v.id) || 0), 0))}</Text>
                <Text style={styles.dotMeta}>•</Text>
                <Text style={styles.heroMetaText}>2 months ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button Row */}
        <View style={styles.actionsContainer}>
          <Pressable style={styles.playAllButton} onPress={handlePlayAll}>
            <Play color="#FFFFFF" size={18} fill="#FFFFFF" />
            <Text style={styles.playAllText}>Play All</Text>
          </Pressable>

          <Pressable style={styles.actionOutlineBtn} onPress={handleToggleLike}>
            <ThumbsUp color={isLiked ? '#EF4444' : '#D1D5DB'} size={16} />
            <Text style={styles.actionOutlineText}>
              {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
            </Text>
          </Pressable>

          <Pressable style={styles.actionOutlineBtn} onPress={handleToggleSave}>
            <Heart color={isSaved ? '#EF4444' : '#D1D5DB'} size={16} fill={isSaved ? '#EF4444' : 'transparent'} />
            <Text style={styles.actionOutlineText}>{isSaved ? 'Saved' : 'Save'}</Text>
          </Pressable>

          <Pressable style={styles.actionOutlineBtn} onPress={handleDownloadAll}>
            <Download color="#D1D5DB" size={16} />
            <Text style={styles.actionOutlineText}>Download</Text>
          </Pressable>
        </View>

        {/* Description Section with expandable text */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText} numberOfLines={showFullDesc ? undefined : 2}>
            {displaySubtitle}
          </Text>
          <Pressable onPress={() => setShowFullDesc(prev => !prev)}>
            <Text style={styles.showMoreToggle}>
              {showFullDesc ? 'Show less ▲' : 'Show more ▼'}
            </Text>
          </Pressable>

          <View style={styles.tagPillsRow}>
            {tagsList.map((tag, idx) => (
              <View key={idx} style={styles.tagPillItem}>
                <Text style={styles.tagPillItemText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Videos in this Playlist Section Title */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitleText}>Videos in this Playlist</Text>
        </View>

        {/* Indexed Vertical Video List matching screenshot */}
        <View style={{ paddingBottom: 30 }}>
          {finalVideos.map((item, index) => {
            const itemThumb = getThumbnailForVideo(item);
            return (
              <Pressable
                key={`pl-item-${item.id}-${index}`}
                style={styles.playlistItemRow}
                onPress={() => playVideo(item)}
              >
                <Text style={styles.itemIndexText}>{index + 1}</Text>
                <View style={styles.itemThumbWrap}>
                  <Image source={{ uri: itemThumb }} style={styles.itemThumb} />
                  {item.duration ? (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationBadgeText}>{item.duration}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMetaText} numberOfLines={1}>
                    {formatViews(item.views)} • {item.duration || '12:00'} • {getRelativeTimeString(item.published_at || item.created_at)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Video Player Modal */}
      <PlayerModal
        playingVideo={playingVideo}
        onSelectVideo={playVideo}
        onSelectPlaylist={handleSelectPlaylist}
        onClose={closePlayer}
      />
    </SafeAreaView>
  );
}
