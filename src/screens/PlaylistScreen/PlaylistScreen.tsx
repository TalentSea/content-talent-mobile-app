import React, { useEffect, useState, useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ListVideo, Layers } from 'lucide-react-native';
import { fetchPlaylists, PlaylistListItem } from '../../services/api/playlistApi';
import { useVideos } from '../../hooks/useVideo';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import { styles } from './styles';

export function PlaylistScreen({ navigation }: any) {
  const { videos } = useVideos();
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadPlaylists() {
    try {
      const response = await fetchPlaylists();
      if (response.items && response.items.length > 0) {
        setPlaylists(response.items);
      } else if (videos && videos.length > 0) {
        const categories = Array.from(new Set(videos.map(v => v.category).filter(Boolean) as string[]));
        const derivedPlaylists: PlaylistListItem[] = categories.map((cat, idx) => {
          const catVideos = videos.filter(v => v.category?.toLowerCase() === cat.toLowerCase());
          const firstVideo = catVideos[0];
          return {
            id: idx + 100,
            name: cat,
            description: `${catVideos.length} ${catVideos.length === 1 ? 'Video' : 'Videos'}`,
            thumbnail_url: firstVideo ? getThumbnailForVideo(firstVideo) : null,
            video_count: catVideos.length,
            created_at: firstVideo?.published_at || firstVideo?.created_at || null,
          };
        });
        setPlaylists(derivedPlaylists);
      } else {
        setPlaylists([]);
      }
    } catch (error) {
      console.warn('[PlaylistScreen] Error loading playlists:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPlaylists();
  }, [videos]);

  function handleRefresh() {
    setRefreshing(true);
    loadPlaylists();
  }

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const q = searchQuery.toLowerCase().trim();
    return playlists.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [playlists, searchQuery]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>All Playlists</Text>
          <Text style={styles.headerSubtitle}>
            {playlists.length} {playlists.length === 1 ? 'Playlist' : 'Playlists'}
          </Text>
        </View>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color="#9CA3AF" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search playlists..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Skeleton Loading State */}
      {loading ? (
        <View style={styles.listContent}>
          <View style={styles.columnWrapper}>
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
          </View>
          <View style={styles.columnWrapper}>
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
          </View>
        </View>
      ) : filteredPlaylists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ListVideo color="#4B5563" size={48} />
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No playlists found matching "${searchQuery}"`
              : 'No playlists available.'}
          </Text>
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.resetSearchBtn}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.resetSearchText}>Show all playlists</Text>
            </Pressable>
          )}
        </View>
      ) : (
        /* 2-Column Grid List of Playlists */
        <FlatList
          data={filteredPlaylists}
          keyExtractor={(item, index) => `pl-${item.id}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('PlaylistDetail', {
                  category: item.name,
                  playlistId: item.id,
                  description: item.description,
                })
              }
            >
              <Image
                source={{
                  uri:
                    item.thumbnail_url ||
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
                }}
                style={styles.cardImage}
              />
              <View style={styles.cardGradientOverlay}>
                <View style={styles.cardTopRow}>
                  <View style={styles.badge}>
                    <Layers color="#FFFFFF" size={11} />
                    <Text style={styles.badgeText}>{item.video_count || 0}</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {item.video_count || 0} {item.video_count === 1 ? 'Video' : 'Videos'}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
