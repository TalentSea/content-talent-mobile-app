import { useAppTheme } from '../../context/ThemeContext';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, Play, Search } from 'lucide-react-native';

import { CategoryTabs } from '../../components/CategoryTabs';
import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useDownloads } from '../../hooks/useDownloads';
import { useUserActivity } from '../../hooks/useUserActivity';
import { fetchCategoriesApi } from '../../services/api/categoriesApi';
import type { DownloadedVideoItem } from '../../services/downloadService';
import type { ApiVideo } from '../../types/video';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import { styles } from './styles';

import { getCleanViewCountForVideo } from '../../services/viewTracker';

export function VideoGridScreen({ route, navigation }: any) {
  const { theme } = useAppTheme();

  const { section } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeMediaTab, setActiveMediaTab] = useState<'videos' | 'playlists' | 'shorts'>('videos');

  const { videos, popularVideos, processingVideos, loading, reload } = useVideos();
  const { downloadedVideos } = useDownloads(videos);
  const { savedVideos, likedVideos, savedPlaylists, likedPlaylists, savedShorts, toggleSaveShort } = useUserActivity(videos);
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);

  const downloadedVideoList: ApiVideo[] = downloadedVideos
    .map((item: DownloadedVideoItem) => item?.video || (item as any))
    .filter((v: ApiVideo) => v && v.id);

  const isPopular = section === 'popular';
  const isRecent = section === 'recent';
  const isDownloads = section === 'downloads';
  const isSaved = section === 'saved';
  const isLiked = section === 'liked';

  const activePlaylistsList = isSaved ? savedPlaylists : isLiked ? likedPlaylists : [];

  const showSearchAndTabs = isPopular || isRecent || (!isDownloads && !isSaved && !isLiked);

  useEffect(() => {
    if (!showSearchAndTabs) return;

    async function loadDynamicCategories() {
      try {
        const fetchedCats = await fetchCategoriesApi();
        const catNames = fetchedCats && fetchedCats.length > 0
          ? fetchedCats.map((c: any) => c.name)
          : [];
        const videoCats = videos
          .map(v => v.category)
          .filter((c): c is string => Boolean(c && typeof c === 'string' && c.trim().length > 0));

        const uniqueCats = Array.from(new Set(['All', ...catNames, ...videoCats]));
        setCategories(uniqueCats);
      } catch (e) {
        const videoCats = videos
          .map(v => v.category)
          .filter((c): c is string => Boolean(c && typeof c === 'string' && c.trim().length > 0));
        setCategories(Array.from(new Set(['All', ...videoCats])));
      }
    }
    loadDynamicCategories();
  }, [videos, showSearchAndTabs]);

  const title = isPopular
    ? 'Popular Videos'
    : isRecent
      ? 'Recently Added Videos'
      : isDownloads
        ? 'Downloads'
        : isSaved
          ? 'Saved'
          : isLiked
            ? 'Liked Content'
            : 'Processing Videos';

  const numCols = 1;

  const baseVideos = isPopular
    ? [...popularVideos].sort((a, b) => getCleanViewCountForVideo(b.id) - getCleanViewCountForVideo(a.id))
    : isRecent
      ? [...videos].sort((a, b) => {
        const timeA = new Date(a.published_at || a.created_at || 0).getTime();
        const timeB = new Date(b.published_at || b.created_at || 0).getTime();
        return timeB - timeA;
      })
      : isDownloads
        ? downloadedVideoList
        : isSaved
          ? savedVideos
          : isLiked
            ? likedVideos
            : processingVideos;

  const filteredVideos = baseVideos.filter(v => {
    if (!showSearchAndTabs) return true;
    const matchesSearch = searchQuery
      ? v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : v.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const [livePlaylists, setLivePlaylists] = useState<any[]>([]);

  useEffect(() => {
    if (isSaved || isLiked) {
      async function loadLivePlaylistsForThumbnails() {
        try {
          const res = await fetchCategoriesApi();
          if (res && res.length > 0) {
            setLivePlaylists(res);
          }
        } catch (e) {
          // Ignore
        }
      }
      loadLivePlaylistsForThumbnails();
    }
  }, [isSaved, isLiked]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.mainBackgroundColor }]}>
      <StatusBar barStyle="light-content" />

      {/* Header with Back Button & Title */}
      <View style={styles.expandedHeader}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <Text style={[styles.backIcon, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>‹</Text>
        </Pressable>

        <Text style={[styles.expandedTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{title}</Text>
        <View style={styles.backButtonSpacer} />
      </View>

      {/* Media Type Tabs (Videos / Playlists / Shorts) for Saved Section */}
      {isSaved && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 14, gap: 8 }}>
          <Pressable
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeMediaTab === 'videos' ? '#E50914' : '#1C1D27',
              borderWidth: 1,
              borderColor: activeMediaTab === 'videos' ? '#E50914' : 'rgba(255, 255, 255, 0.08)',
            }}
            onPress={() => setActiveMediaTab('videos')}
          >
            <Text style={{ color: theme.primaryTextColor, fontWeight: '700', fontSize: 13 }}>Videos ({baseVideos.length})</Text>
          </Pressable>

          <Pressable
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeMediaTab === 'playlists' ? '#E50914' : '#1C1D27',
              borderWidth: 1,
              borderColor: activeMediaTab === 'playlists' ? '#E50914' : 'rgba(255, 255, 255, 0.08)',
            }}
            onPress={() => setActiveMediaTab('playlists')}
          >
            <Text style={{ color: theme.primaryTextColor, fontWeight: '700', fontSize: 13 }}>Playlists ({activePlaylistsList.length})</Text>
          </Pressable>

          <Pressable
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeMediaTab === 'shorts' ? '#E50914' : '#1C1D27',
              borderWidth: 1,
              borderColor: activeMediaTab === 'shorts' ? '#E50914' : 'rgba(255, 255, 255, 0.08)',
            }}
            onPress={() => setActiveMediaTab('shorts')}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Shorts ({savedShorts.length})</Text>
          </Pressable>
        </View>
      )}

      {/* Search Input Bar (Shown for Popular, Recently Added, etc.) */}
      {showSearchAndTabs && (
        <View style={styles.searchBarContainer}>
          <Search size={16} color={theme.mutedTextColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}
            placeholder="Search videos..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Category Tabs (Shown for Popular, Recently Added, etc.) */}
      {showSearchAndTabs && (
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {/* Main Content Area */}
      {isSaved && activeMediaTab === 'shorts' ? (
        <FlatList
          data={savedShorts}
          keyExtractor={(item, index) => `saved-short-${item.id}-${index}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, paddingTop: 6 }}
          renderItem={({ item }) => {
            const shortVideo: ApiVideo = {
              id: item.id,
              title: item.title,
              description: item.description || null,
              stream_url: item.streamUrl,
              playback_url: item.streamUrl,
              main_thumbnail_url: item.thumbnailUrl || null,
              duration: item.duration ? String(item.duration) : null,
              views_count: item.viewsCount || 0,
              views: item.viewsCount || 0,
              likes_count: item.likesCount || 0,
              likes: item.likesCount || 0,
              category: 'Shorts',
              status: 'published',
              tags: [],
              encode_progress: 100,
              is_playable: true,
              published_at: item.publishedAt || null,
              scheduled_at: null,
              created_at: null,
            };

            return (
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  gap: 14,
                  borderBottomWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.06)',
                }}
                onPress={() => playVideo(shortVideo)}
              >
                <View
                  style={{
                    width: 74,
                    height: 106,
                    borderRadius: 10,
                    overflow: 'hidden',
                    backgroundColor: '#1C1D2A',
                    position: 'relative',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {item.thumbnailUrl ? (
                    <Image
                      source={{ uri: item.thumbnailUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Play color="#818CF8" size={24} fill="#818CF8" />
                    </View>
                  )}
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>SHORT</Text>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', lineHeight: 20, marginBottom: 4 }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }} numberOfLines={1}>
                    {item.creatorName || 'Creator'} • {item.viewsCount} views
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pressable
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#E50914',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 14,
                      }}
                      onPress={() => playVideo(shortVideo)}
                    >
                      <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Watch</Text>
                    </Pressable>

                    <Pressable
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#1E1F2E',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 14,
                      }}
                      onPress={() => toggleSaveShort(item)}
                    >
                      <Bookmark size={12} color="#3B82F6" fill="#3B82F6" />
                      <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '600' }}>Saved</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginVertical: 30 }}>
              No saved shorts yet. Tap "Save" while watching Shorts to view them here.
            </Text>
          }
        />
      ) : (isSaved || isLiked) && activeMediaTab === 'playlists' ? (
        <FlatList
          data={activePlaylistsList}
          keyExtractor={(item, index) => `fav-pl-${item.id}-${index}`}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => {
            const matchingVideo = videos.find(v => v.category?.toLowerCase() === item.name.toLowerCase());
            const resolvedThumb = item.thumbnail_url || (matchingVideo ? getCleanViewCountForVideo(matchingVideo.id) && getThumbnailForVideo(matchingVideo) : null);

            return (
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 14,
                  borderBottomWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                }}
                onPress={() => navigation.navigate('PlaylistDetail', { playlistId: item.id, category: item.name })}
              >
                {resolvedThumb ? (
                  <Image
                    source={{ uri: resolvedThumb }}
                    style={{ width: 110, height: 64, borderRadius: 8, backgroundColor: '#1E1E2E' }}
                  />
                ) : (
                  <View style={{ width: 110, height: 64, borderRadius: 8, backgroundColor: '#1E1E2E', justifyContent: 'center', alignItems: 'center' }}>
                    <Search color="#6B7280" size={24} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.primaryTextColor, fontSize: 15, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ color: theme.mutedTextColor, fontSize: 12 }} numberOfLines={1}>
                    {typeof item.video_count === 'number'
                      ? `${item.video_count} ${item.video_count === 1 ? 'video' : 'videos'}`
                      : 'Playlist'}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: theme.mutedTextColor, fontSize: 13, textAlign: 'center', marginVertical: 30 }}>
              {isSaved ? 'No saved playlists found.' : 'No liked playlists found.'}
            </Text>
          }
        />
      ) : (
        <VerticalList
          videos={filteredVideos}
          numColumns={numCols}
          refreshing={loading}
          onRefresh={reload}
          onPressVideo={playVideo}
          emptyText={
            isDownloads
              ? 'No downloaded offline videos found.'
              : isSaved
                ? 'No saved videos found.'
                : isLiked
                  ? 'No liked videos found.'
                  : 'No videos match your filter.'
          }
        />
      )}

      {/* Video Player Modal */}
      <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />
    </SafeAreaView>
  );
}
