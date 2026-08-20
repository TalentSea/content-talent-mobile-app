import React, { useEffect, useState } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { VerticalList } from '../../components/VerticalList';
import { CategoryTabs } from '../../components/CategoryTabs/CategoryTabs';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { fetchUserCategoriesApi, MobileCategoryItem } from '../../services/api/userActivityApi';
import { styles } from './styles';
import { colors } from '../../constants/colors';

export function CategoryVideosScreen({ route, navigation }: any) {
  const { category: initialCategory = 'All' } = route.params || {};

  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  const { popularVideos, loading, reload } = useVideos();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback();

  useEffect(() => {
    async function loadBackendCategories() {
      try {
        const fetchedCats = await fetchUserCategoriesApi();
        if (fetchedCats && fetchedCats.length > 0) {
          const names = fetchedCats.map((item: MobileCategoryItem) => item.name);
          const catList = Array.from(new Set(['All', ...names]));
          setCategories(catList);
        }
      } catch (err) {
        console.warn('[CategoryVideosScreen] Error loading categories from backend:', err);
      }
    }
    loadBackendCategories();
  }, []);

  const filteredVideos =
    selectedCategory === 'All'
      ? popularVideos
      : popularVideos.filter(
          v => v.category?.toLowerCase() === selectedCategory.toLowerCase(),
        );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.text} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>{selectedCategory} Streams</Text>
        <View style={styles.headerPlaceholder} />
      </View>



      <VerticalList
        videos={filteredVideos.length > 0 ? filteredVideos : popularVideos}
        numColumns={2}
        refreshing={loading}
        onRefresh={reload}
        onPressVideo={playVideo}
        emptyText={`No videos found in ${selectedCategory}.`}
      />

      <PlayerModal
        playingVideo={playingVideo}
        onUpgradeSubscription={() => {
          closePlayer();
          navigation?.navigate('Subscription');
        }}
        onClose={closePlayer}
      />

    </SafeAreaView>
  );
}
