import React, { useState } from 'react';
import {
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Link } from 'lucide-react-native';

import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { fetchVideoPlayInfo } from '../../services/api/video';
import { styles } from './styles';

export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { videos, popularVideos, loading, reload } = useVideos();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);
  const [isOpeningUrl, setIsOpeningUrl] = useState(false);

  // Filter search results by title, category, tags, OR video ID share code (#STREAMR-X or number)
  const cleanQuery = query.trim();
  const searchResults = cleanQuery
    ? popularVideos.filter(v => {
        const titleMatch = v.title.toLowerCase().includes(cleanQuery.toLowerCase());
        const catMatch = v.category?.toLowerCase().includes(cleanQuery.toLowerCase());
        const tagMatch = v.tags?.some(t => t.toLowerCase().includes(cleanQuery.toLowerCase()));
        const idMatch =
          cleanQuery.replace(/[^0-9]/g, '') === String(v.id) ||
          cleanQuery.toLowerCase().includes(`streamr-${v.id}`);
        return titleMatch || catMatch || tagMatch || idMatch;
      })
    : popularVideos;

  async function handleOpenLinkOrCode(inputStr: string) {
    const trimmed = inputStr.trim();
    if (!trimmed) return;

    setIsOpeningUrl(true);
    try {
      // 1. Check if input contains a video ID or Share Code (e.g. #STREAMR-5 or 5)
      const extractedId = trimmed.replace(/[^0-9]/g, '');
      if (extractedId) {
        const idNum = parseInt(extractedId, 10);
        const match = videos.find(v => v.id === idNum);
        if (match) {
          playVideo(match);
          setIsOpeningUrl(false);
          return;
        }
      }

      // 2. Query live video play info directly from backend API for custom stream URLs
      const targetId = extractedId ? parseInt(extractedId, 10) : 1;
      const playInfo = await fetchVideoPlayInfo(targetId);
      if (playInfo) {
        playVideo({
          id: targetId,
          title: playInfo.title || 'Shared Stream',
          description: playInfo.description || null,
          main_thumbnail_url: playInfo.poster || null,
          category: 'General',
          tags: [],
          status: 'published',
          encode_progress: 100,
          is_playable: true,
          views: 0,
          duration: '00:00',
          published_at: null,
          scheduled_at: null,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('[SearchScreen] Open link/code notice:', err);
    } finally {
      setIsOpeningUrl(false);
    }
  }

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
            placeholder="Search title, paste stream link or #STREAMR-code..."
            placeholderTextColor="#6B7280"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              if (query.trim()) {
                setRecentSearches(prev => Array.from(new Set([query.trim(), ...prev])).slice(0, 6));
              }
              handleOpenLinkOrCode(query);
            }}
            autoFocus
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <X size={16} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Quick Action: Open Link or Code */}
      {query.includes('http') || query.toUpperCase().includes('STREAMR') || /^[0-9]+$/.test(query.trim()) ? (
        <Pressable
          style={{
            marginHorizontal: 16,
            marginTop: 8,
            marginBottom: 12,
            backgroundColor: '#6366F1',
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onPress={() => handleOpenLinkOrCode(query)}
        >
          <Link color="#FFFFFF" size={16} />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
            Open Shared Link or Code: "{query.trim()}"
          </Text>
        </Pressable>
      ) : null}

      {/* Recent Query Suggestion Pills */}
      {!query && recentSearches.length > 0 ? (
        <View style={styles.recentWrap}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <View style={styles.tagRow}>
            {recentSearches.map(item => (
              <Pressable
                key={item}
                style={styles.tag}
                onPress={() => {
                  setQuery(item);
                  if (item.includes('STREAMR')) {
                    handleOpenLinkOrCode(item);
                  }
                }}
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
            : 'Type a title or paste a share link / code to watch.'
        }
      />

      <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />
    </SafeAreaView>
  );
}
