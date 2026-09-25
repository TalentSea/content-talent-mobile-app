import { useAppTheme } from '../../context/ThemeContext';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, ChevronLeft, ChevronRight, Download, Film, Heart, History } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { styles } from './styles';
import { useVideos } from '../../hooks/useVideo';
import { useUserActivity } from '../../hooks/useUserActivity';
import { useDownloads } from '../../hooks/useDownloads';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { syncUserActivityWithBackend } from '../../services/userActivity';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import type { ApiVideo } from '../../types/video';

export function LibraryScreen({ route, navigation }: any) {
  const { theme } = useAppTheme();

  const type = route.params?.type ?? 'saved';
  const [activeMediaTab, setActiveMediaTab] = useState<'videos' | 'playlists'>('videos');
  const [refreshing, setRefreshing] = useState(false);

  const { videos, loading: videosLoading, reload } = useVideos();
  const { savedVideos, likedVideos, savedPlaylists } = useUserActivity(videos);
  const { downloadedVideos } = useDownloads(videos);
  const { history } = useWatchHistory(videos);
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);

  const downloadedVideoList: ApiVideo[] = downloadedVideos
    .map((item: any) => item?.video || item)
    .filter((v: ApiVideo) => v && v.id);

  const historyVideoList: ApiVideo[] = history
    .map(item => item.video)
    .filter((v: ApiVideo) => v && v.id);

  const config = {
    history: {
      Icon: History,
      title: 'Watch History',
      emptyTitle: 'No watch history yet',
      description: 'Videos you watch will appear here so you can pick up where you left off.',
      items: historyVideoList,
    },
    downloads: {
      Icon: Download,
      title: 'Downloads',
      emptyTitle: 'No downloads yet',
      description: 'Videos you download for offline viewing will appear here.',
      items: downloadedVideoList,
    },
    liked: {
      Icon: Heart,
      title: 'Liked Videos',
      emptyTitle: 'No liked videos yet',
      description: 'Videos you like will be saved here for easy access.',
      items: likedVideos,
    },
    saved: {
      Icon: Bookmark,
      title: 'Saved Content',
      emptyTitle: 'No saved videos yet',
      description: 'Save videos and playlists to return to them later.',
      items: savedVideos,
    },
  }[type as 'history' | 'downloads' | 'liked' | 'saved'];

  const { Icon, title, emptyTitle, description, items } = config;
  const isSavedSection = type === 'saved';

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        reload(false),
        syncUserActivityWithBackend(),
      ]);
    } catch {
      // Ignore refresh errors
    } finally {
      setRefreshing(false);
    }
  };

  function handleOpenPlaylist(playlist: any) {
    navigation.navigate('HomeTab' as any, {
      screen: 'PlaylistDetail',
      params: {
        playlistId: playlist.id,
        category: playlist.name,
      },
    } as any);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.mainBackgroundColor }]}>
      <StatusBar barStyle="light-content" />

      {/* Screen Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={10}>
          <ChevronLeft color={theme.primaryTextColor} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Sub-Tabs for Saved Section (Videos / Playlists) */}
      {isSavedSection && (
        <View style={styles.tabsContainer}>
          <Pressable
            style={[
              styles.tabButton,
              { backgroundColor: theme.cardBackgroundColor },
              activeMediaTab === 'videos' && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor },
            ]}
            onPress={() => setActiveMediaTab('videos')}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeMediaTab === 'videos' ? theme.buttonTextColor : theme.mutedTextColor },
              ]}
            >
              Videos ({savedVideos.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabButton,
              { backgroundColor: theme.cardBackgroundColor },
              activeMediaTab === 'playlists' && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor },
            ]}
            onPress={() => setActiveMediaTab('playlists')}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeMediaTab === 'playlists' ? theme.buttonTextColor : theme.mutedTextColor },
              ]}
            >
              Playlists ({savedPlaylists.length})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Main Content Area */}
      {isSavedSection && activeMediaTab === 'playlists' ? (
        savedPlaylists.length > 0 ? (
          <FlatList
            data={savedPlaylists}
            keyExtractor={item => `saved-pl-${item.id}`}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryTextColor} />
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.playlistRow}
                onPress={() => handleOpenPlaylist(item)}
              >
                {item.thumbnail_url ? (
                  <Image source={{ uri: item.thumbnail_url }} style={styles.playlistThumbnail} />
                ) : (
                  <View style={[styles.playlistThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Film color="#6B7280" size={24} />
                  </View>
                )}
                <View style={styles.playlistCopy}>
                  <Text style={[styles.playlistTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.playlistMeta, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]} numberOfLines={1}>
                    {typeof item.video_count === 'number'
                      ? `${item.video_count} ${item.video_count === 1 ? 'video' : 'videos'}`
                      : 'Playlist'}
                  </Text>
                </View>
                <Bookmark size={18} color="#6366F1" fill="#6366F1" />
              </Pressable>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.iconWrap}>
              <Bookmark color={colors.primary} size={30} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>No saved playlists yet</Text>
            <Text style={[styles.emptyDescription, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>
              Bookmark any creator playlist to quickly return to it here.
            </Text>
            <Pressable
              style={styles.exploreButton}
              onPress={() => navigation.navigate('HomeTab' as any)}
            >
              <Text style={[styles.exploreButtonText, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>Explore Playlists</Text>
            </Pressable>
          </View>
        )
      ) : items.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryTextColor} />
          }
        >
          {items.map(video => {
            const thumb = getThumbnailForVideo(video);
            return (
              <Pressable
                key={`lib-v-${video.id}`}
                style={styles.videoRow}
                onPress={() => playVideo(video)}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.thumbnailFallback} />
                )}
                <View style={styles.videoCopy}>
                  <Text style={[styles.videoTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={[styles.videoDescription, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]} numberOfLines={1}>
                    {video.category || video.duration || 'Streamr Video'}
                  </Text>
                </View>
                <ChevronRight size={18} color={theme.mutedTextColor} />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.iconWrap}>
            <Icon color={colors.primary} size={30} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{emptyTitle}</Text>
          <Text style={[styles.emptyDescription, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{description}</Text>
          <Pressable
            style={styles.exploreButton}
            onPress={() => navigation.navigate('HomeTab' as any)}
          >
            <Text style={[styles.exploreButtonText, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>Explore Videos</Text>
          </Pressable>
        </View>
      )}

      {/* Video Player Modal */}
      <PlayerModal
        playingVideo={playingVideo}
        onSelectVideo={playVideo}
        onSelectPlaylist={(p) => handleOpenPlaylist(p)}
        onUpgradeSubscription={() => {
          closePlayer();
          navigation.navigate('Subscription');
        }}
        onClose={closePlayer}
      />
    </SafeAreaView>
  );
}
