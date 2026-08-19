import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { fetchVideos } from '../../services/api/video';
import { fetchPlaylists, PlaylistListItem } from '../../services/api/playlistApi';
import { getCleanViewCountForVideo } from '../../services/viewTracker';
import { formatViews, getRelativeTimeString, formatDurationString } from '../../utils/timeUtils';
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
          if (tags && tags.length > 0 && v.tags && v.tags.some(t => tags.includes(t))) {
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
              <Pressable
                style={styles.videoCard}
                onPress={() => onSelectVideo && onSelectVideo(item)}
              >
                <View>
                  <Image
                    source={{
                      uri:
                        item.main_thumbnail_url ||
                        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
                    }}
                    style={styles.videoThumbnail}
                  />
                  {item.duration ? (
                    <View style={styles.videoDurationBadge}>
                      <Text style={styles.durationText}>{formatDurationString(item.duration)}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.videoContent}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.videoMeta} numberOfLines={1}>
                    {item.category || 'General'} • {formatViews(getCleanViewCountForVideo(item.id))}
                  </Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 2 }}>
                    {getRelativeTimeString(item.published_at || item.created_at)}
                  </Text>
                </View>
              </Pressable>
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
                  <Image
                    source={{
                      uri:
                        item.thumbnail_url ||
                        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
                    }}
                    style={styles.playlistThumbnail}
                  />
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
