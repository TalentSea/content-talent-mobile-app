import React, { useState } from 'react';
import {
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';

import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { styles } from './styles';

const RECENT_SEARCHES = ['ExoPlayer HLS', 'FastAPI', 'React Native', 'Bunny Stream'];

export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const { popularVideos, loading, reload } = useVideos();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback();

  const searchResults = query.trim()
    ? popularVideos.filter(v =>
        v.title.toLowerCase().includes(query.toLowerCase()),
      )
    : popularVideos;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Top Search Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder="Search titles, tags, topics..."
            placeholderTextColor="#6B7280"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <X size={16} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Recent Query Suggestion Pills */}
      {!query ? (
        <View style={styles.recentWrap}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <View style={styles.tagRow}>
            {RECENT_SEARCHES.map(item => (
              <Pressable
                key={item}
                style={styles.tag}
                onPress={() => setQuery(item)}
              >
                <Text style={styles.tagText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* Search Results Grid */}
      <VerticalList
        videos={searchResults}
        numColumns={2}
        refreshing={loading}
        onRefresh={reload}
        onPressVideo={playVideo}
        emptyText={
          query
            ? `No search results for "${query}"`
            : 'Type a query to search videos.'
        }
      />

      <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />
    </SafeAreaView>
  );
}
