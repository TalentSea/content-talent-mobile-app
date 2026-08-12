import React from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { styles } from './styles';

export function CategoryVideosScreen({ route, navigation }: any) {
  const { category = 'All' } = route.params || {};
  const { popularVideos, loading, reload } = useVideos();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback();

  const filteredVideos =
    category === 'All'
      ? popularVideos
      : popularVideos.filter(
          v => v.category?.toLowerCase() === category.toLowerCase(),
        );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{category} Videos</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <VerticalList
        videos={filteredVideos}
        numColumns={2}
        refreshing={loading}
        onRefresh={reload}
        onPressVideo={playVideo}
        emptyText={`No videos found in ${category}.`}
      />

      <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />
    </SafeAreaView>
  );
}
