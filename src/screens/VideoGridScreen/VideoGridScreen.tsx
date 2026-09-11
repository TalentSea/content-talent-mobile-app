import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';

import { CategoryTabs } from '../../components/CategoryTabs';
import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useDownloads } from '../../hooks/useDownloads';
import { useUserActivity } from '../../hooks/useUserActivity';
import { fetchUserCategoriesApi } from '../../services/api/userActivityApi';
import type { DownloadedVideoItem } from '../../services/downloadService';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

import { getCleanViewCountForVideo } from '../../services/viewTracker';

export function VideoGridScreen({ route, navigation }: any) {
  const { section } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  const { videos, popularVideos, processingVideos, loading, reload } = useVideos();
  const { downloadedVideos } = useDownloads(videos);
  const { savedVideos, likedVideos } = useUserActivity(videos);
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);

  const downloadedVideoList: ApiVideo[] = downloadedVideos
    .map((item: DownloadedVideoItem) => item?.video || (item as any))
    .filter((v: ApiVideo) => v && v.id);

  const isPopular = section === 'popular';
  const isRecent = section === 'recent';
  const isDownloads = section === 'downloads';
  const isSaved = section === 'saved';
  const isLiked = section === 'liked';

  const showSearchAndTabs = isPopular || isRecent || (!isDownloads && !isSaved && !isLiked);

  useEffect(() => {
    if (!showSearchAndTabs) return;

    async function loadDynamicCategories() {
      try {
        const fetchedCats = await fetchUserCategoriesApi();
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
          ? 'Saved Videos'
          : isLiked
            ? 'Liked Videos'
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

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header with Back Button & Title */}
      <View style={styles.expandedHeader}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Text style={styles.expandedTitle}>{title}</Text>
        <View style={styles.backButtonSpacer} />
      </View>

      {/* Search Input Bar (Shown for Popular, Recently Added, etc.) */}
      {showSearchAndTabs && (
        <View style={styles.searchBarContainer}>
          <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
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

      {/* Vertical List Component */}
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

      {/* Video Player Modal */}
      <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />
    </SafeAreaView>
  );
}
