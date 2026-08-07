import React, { useEffect, useState } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import {
  fetchPlaylistDetails,
  fetchPlaylistVideos,
  PlaylistDetails,
} from '../../services/api/playlistApi';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

export function CategoryDetailScreen({ route, navigation }: any) {
  const { category = 'Technology', playlistId } = route.params || {};
  const { popularVideos, loading: popularLoading, reload: popularReload } = useVideos();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback();

  const [playlistDetails, setPlaylistDetails] = useState<PlaylistDetails | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(!!playlistId);

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

  const displayTitle = playlistDetails?.name || category;
  const displaySubtitle = playlistDetails?.description || `Explore curated streams and tutorials in ${category}`;
  const displayVideos = playlistId
    ? playlistVideos.length > 0
      ? playlistVideos
      : popularVideos
    : popularVideos.filter(
        v => !v.category || v.category.toLowerCase() === category.toLowerCase(),
      );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Category / Playlist Banner Header Card */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
        <Text style={styles.bannerSubtitle} numberOfLines={2}>
          {displaySubtitle}
        </Text>
      </View>

      {/* Vertical Feed Grid (VL) */}
      <VerticalList
        videos={displayVideos.length > 0 ? displayVideos : popularVideos}
        numColumns={2}
        refreshing={loading || popularLoading}
        onRefresh={popularReload}
        onPressVideo={playVideo}
        emptyText={`No videos found in ${displayTitle}.`}
      />

      <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />
    </SafeAreaView>
  );
}
