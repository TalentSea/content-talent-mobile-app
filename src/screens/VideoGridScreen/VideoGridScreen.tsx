import React, { useState } from 'react';
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
import { styles } from './styles';

const CATEGORIES = ['All', 'Popular', 'Processing', 'Tutorials', 'Tech'];

export function VideoGridScreen({ route, navigation }: any) {
  const { section } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { popularVideos, processingVideos, loading, reload } = useVideos();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback();

  const sectionConfig = {
    popular: { title: 'Popular Videos', videos: popularVideos },
    processing: { title: 'Processing Videos', videos: processingVideos },
    continue: {
      title: 'Continue Watching',
      videos: popularVideos.slice(0, 3),
    },
    recent: {
      title: 'Recently Added',
      videos: popularVideos.slice(1),
    },
  };
  const { title, videos: baseVideos } =
    sectionConfig[section as keyof typeof sectionConfig] ?? sectionConfig.popular;

  const filteredVideos = baseVideos.filter(v => {
    const matchesSearch = searchQuery
      ? v.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory =
      selectedCategory === 'All' || selectedCategory === 'Popular'
        ? true
        : v.category === selectedCategory;
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

      {/* Search Input Bar */}
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

      {/* Category Tabs */}
      <CategoryTabs
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Vertical List (VL) 2-column Grid */}
      <VerticalList
        videos={filteredVideos}
        numColumns={2}
        refreshing={loading}
        onRefresh={reload}
        onPressVideo={playVideo}
        emptyText="No videos match your filter."
      />

      {/* Video Player Modal */}
      <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />
    </SafeAreaView>
  );
}
