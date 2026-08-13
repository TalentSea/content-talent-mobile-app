import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPlaylists, PlaylistListItem } from '../../services/api/playlistApi';
import { styles } from './styles';

export function PlaylistScreen({ navigation }: any) {
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadPlaylists() {
    try {
      const response = await fetchPlaylists();
      setPlaylists(response.items || []);
    } catch (error) {
      console.warn('[PlaylistScreen] Error loading playlists:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPlaylists();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadPlaylists();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>All Playlists</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Loading live playlists...</Text>
        </View>
      ) : (
        /* 2-Column Vertical Grid list (VL) of Playlists */
        <FlatList
          data={playlists}
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
                navigation.navigate('CategoryDetail', {
                  category: item.name,
                  playlistId: item.id,
                })
              }
            >
              <Image
                source={{
                  uri:
                    item.thumbnail_url ||
                    'https://via.placeholder.com/400x200/1E1E2E/FFFFFF?text=Playlist',
                }}
                style={styles.cardImage}
              />
              <View style={styles.cardOverlay}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardMeta}>{item.video_count} Videos</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
