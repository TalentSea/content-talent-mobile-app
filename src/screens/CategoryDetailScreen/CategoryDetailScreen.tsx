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
  Heart,
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
import type { ApiVideo } from '../../types/video';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import { getCleanViewCountForVideo } from '../../services/viewTracker';
import { formatViews, getRelativeTimeString, formatDurationString } from '../../utils/timeUtils';
import { styles } from './styles';

export function CategoryDetailScreen({ route, navigation }: any) {
  const { category: initialCategory = 'All', playlistId } = route.params || {};

  const { popularVideos } = useVideos();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(popularVideos);
  const { toggleSavePlaylist, isPlaylistSaved } = useUserActivity();
  const { downloadVideoInApp } = useDownloads();

  const [playlistDetails, setPlaylistDetails] = useState<PlaylistDetails | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(!!playlistId);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isSaved, setIsSaved] = useState(playlistId ? isPlaylistSaved(playlistId) : false);

  useEffect(() => {
    if (playlistId) {
      setIsSaved(isPlaylistSaved(playlistId));
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
  const displayCategory = playlistDetails?.name || (initialCategory !== 'All' ? initialCategory : 'Playlist');
  const displaySubtitle = playlistDetails?.description || '';

  const finalVideos = playlistId
    ? playlistVideos
    : popularVideos.filter(
        v => v.category?.toLowerCase() === initialCategory.toLowerCase(),
      );

  const heroThumb =
    playlistDetails?.thumbnail_url ||
    (finalVideos[0] ? getThumbnailForVideo(finalVideos[0]) : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80');

  function handlePlayAll() {
    if (finalVideos.length > 0) {
      playVideo(finalVideos[0]);
    }
  }

  function handleToggleSave() {
    const targetId = playlistId || 1;
    const nowSaved = toggleSavePlaylist(targetId, displayTitle);
    setIsSaved(nowSaved);
  }

  function handleDownloadAll() {
    if (finalVideos.length > 0) {
      finalVideos.forEach(video => {
        downloadVideoInApp(video);
      });
    }
  }

  function handleSelectPlaylist(playlist: PlaylistListItem) {
    navigation.push('CategoryDetail', {
      category: playlist.name,
      playlistId: playlist.id,
    });
  }

  const playlistAge = getRelativeTimeString(playlistDetails?.created_at || (finalVideos[0]?.published_at || finalVideos[0]?.created_at));

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
                {finalVideos.length > 0 && (
                  <>
                    <Text style={styles.dotMeta}>•</Text>
                    <Text style={styles.heroMetaText}>
                      {formatViews(finalVideos.reduce((acc, v) => acc + (getCleanViewCountForVideo(v.id) || 0), 0))}
                    </Text>
                  </>
                )}
                {playlistAge ? (
                  <>
                    <Text style={styles.dotMeta}>•</Text>
                    <Text style={styles.heroMetaText}>{playlistAge}</Text>
                  </>
                ) : null}
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
        </View>

        {/* Description Section with expandable text (Only shown if description exists) */}
        {displaySubtitle ? (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText} numberOfLines={showFullDesc ? undefined : 2}>
              {displaySubtitle}
            </Text>
            {displaySubtitle.length > 80 && (
              <Pressable onPress={() => setShowFullDesc(prev => !prev)}>
                <Text style={styles.showMoreToggle}>
                  {showFullDesc ? 'Show less ▲' : 'Show more ▼'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {/* Videos in this Playlist Section Title */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitleText}>Videos in this Playlist</Text>
        </View>

        {/* Vertical Video List */}
        <View style={{ paddingBottom: 30 }}>
          {finalVideos.length === 0 ? (
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginVertical: 30 }}>
              No videos in this playlist yet.
            </Text>
          ) : (
            finalVideos.map((item, index) => {
              const itemThumb = getThumbnailForVideo(item);
              const formattedDuration = formatDurationString(item.duration);
              return (
                <Pressable
                  key={`pl-item-${item.id}-${index}`}
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
                    <Text style={styles.itemMetaText} numberOfLines={1}>
                      {formatViews(item.views)} • {formattedDuration} • {getRelativeTimeString(item.published_at || item.created_at)}
                    </Text>
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

