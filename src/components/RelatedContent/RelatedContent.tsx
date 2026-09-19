import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { VideoCard } from '../VideoCard/VideoCard';
import { fetchVideos } from '../../services/api/video';
import { fetchPlaylists, PlaylistListItem } from '../../services/api/playlistApi';
import { getCleanViewCountForVideo } from '../../services/viewTracker';
import { formatViews, getRelativeTimeString, formatDurationString } from '../../utils/timeUtils';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

type RelatedContentProps = {
  currentVideoId?: number;
  currentPlaylistId?: number;
  category?: string | null;
  tags?: string[];
  onSelectVideo?: (video: ApiVideo) => void;
  onSelectPlaylist?: (playlist: PlaylistListItem) => void;
};

export function RelatedContent({
  currentVideoId,
  currentPlaylistId,
  category,
  tags = [],
  onSelectVideo,
  onSelectPlaylist,
}: RelatedContentProps) {
  const [relatedVideos, setRelatedVideos] = useState<ApiVideo[]>([]);
  const [relatedPlaylists, setRelatedPlaylists] = useState<PlaylistListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const tagsKey = tags ? tags.join(',') : '';

  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1500);

    async function loadRelated() {
      try {
        setLoading(true);
        const [videosRes, playlistsRes] = await Promise.allSettled([
          fetchVideos({ limit: 50 }),
          fetchPlaylists(undefined, 1, 20),
        ]);

        if (!isMounted) return;

        let allVids: ApiVideo[] =
          videosRes.status === 'fulfilled' && videosRes.value?.items
            ? videosRes.value.items
            : [];

        const allPlaylists: PlaylistListItem[] =
          playlistsRes.status === 'fulfilled' && playlistsRes.value?.items
            ? playlistsRes.value.items
            : [];

        // Filter related videos by category or tags
        let filteredVids = allVids.filter(v => {
          if (v.id === currentVideoId || v.is_playable === false) return false;
          if (category && v.category && v.category.toLowerCase() === category.toLowerCase()) {
            return true;
          }
          if (tags && tags.length > 0 && v.tags && v.tags.some((t: string) => tags.includes(t))) {
            return true;
          }
          return false;
        });

        // Fallback: if category filter yields fewer than 3 items, append available live streams
        if (filteredVids.length < 3) {
          const remainingVids = allVids.filter(
            (v: ApiVideo) => v.id !== currentVideoId && v.is_playable !== false && !filteredVids.some(fv => fv.id === v.id),
          );
          filteredVids = [...filteredVids, ...remainingVids];
        }

        // Filter playlists
        let filteredPlaylists = allPlaylists.filter(p => p.id !== currentPlaylistId);

        setRelatedVideos(filteredVids);
        setRelatedPlaylists(filteredPlaylists);
      } catch (err) {
        console.warn('[RelatedContent] Error loading related items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRelated();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentVideoId, currentPlaylistId, category, tagsKey]);

  if (loading) {
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator color="#6366F1" size="small" />
      </View>
    );
  }

  if (relatedVideos.length === 0 && relatedPlaylists.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Related Videos Section */}
      {relatedVideos.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Related Videos ({category || 'Category'})</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>More like this</Text>
            </View>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={relatedVideos}
            keyExtractor={(item, idx) => `rel-vid-${item.id}-${idx}`}
            contentContainerStyle={styles.horizontalListContainer}
            renderItem={({ item }) => (
              <VideoCard
                video={item}
                id={String(item.id)}
                title={item.title}
                thumbnailUrl={item.main_thumbnail_url || undefined}
                category={item.category || undefined}
                durationText={item.duration || undefined}
                badgeText={item.status}
                onPress={() => onSelectVideo && onSelectVideo(item)}
              />
            )}
          />
        </View>
      )}

      {/* Related Playlists Section */}
      {relatedPlaylists.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Related Playlists</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Curated Series</Text>
            </View>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={relatedPlaylists}
            keyExtractor={(item, idx) => `rel-pl-${item.id}-${idx}`}
            contentContainerStyle={styles.horizontalListContainer}
            renderItem={({ item }) => (
              <Pressable
                style={styles.playlistCard}
                onPress={() => onSelectPlaylist && onSelectPlaylist(item)}
              >
                <View>
                  {item.thumbnail_url ? (
                    <Image
                      source={{ uri: item.thumbnail_url }}
                      style={styles.playlistThumbnail}
                    />
                  ) : (
                    <View style={[styles.playlistThumbnail, { backgroundColor: '#1E1E2E' }]} />
                  )}
                  <View style={styles.playlistOverlay}>
                    <Text style={styles.playlistOverlayText}>{item.video_count} Streams</Text>
                  </View>
                </View>
                <Text style={styles.playlistTitle} numberOfLines={1}>
                  {item.name || 'Playlist'}
                </Text>
                <Text style={styles.playlistSub} numberOfLines={1}>
                  {item.description || 'Curated video series'}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}
