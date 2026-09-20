import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Link, Sparkles, TrendingUp, Clock, Tag } from 'lucide-react-native';

import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { fetchVideoPlayInfo } from '../../services/api/video';
import { getCleanViewCountForVideo } from '../../services/viewTracker';
import { styles } from './styles';

export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Action',
    'Comedy',
    'Trending',
    'Trailers',
    'Tutorial',
  ]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { videos, loading, reload } = useVideos();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);
  const [isOpeningUrl, setIsOpeningUrl] = useState(false);

  function addRecentSearch(searchTerm: string) {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setRecentSearches(prev => Array.from(new Set([trimmed, ...prev])).slice(0, 8));
  }

  // Extract unique video categories dynamically
  const categories = useMemo(() => {
    return Array.from(
      new Set(videos.map(v => v.category).filter(Boolean) as string[])
    );
  }, [videos]);

  // Build list of filter tabs
  const filterTabs = useMemo(() => {
    const base = [
      { id: 'all', label: 'All', icon: Sparkles },
      { id: 'popular', label: 'Popular', icon: TrendingUp },
      { id: 'newest', label: 'Newest', icon: Clock },
    ];
    const catTabs = categories.map(cat => ({
      id: `cat:${cat.toLowerCase()}`,
      label: cat,
      icon: Tag,
    }));
    return [...base, ...catTabs];
  }, [categories]);

  // Filter and sort search results
  const cleanQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    let result = videos;

    // 1. Text Search Filter
    if (cleanQuery) {
      result = result.filter(v => {
        const titleMatch = v.title?.toLowerCase().includes(cleanQuery);
        const catMatch = v.category?.toLowerCase().includes(cleanQuery);
        const tagMatch = v.tags?.some(t => t.toLowerCase().includes(cleanQuery));
        const idMatch =
          cleanQuery.replace(/[^0-9]/g, '') === String(v.id) ||
          cleanQuery.includes(`streamr-${v.id}`);
        return titleMatch || catMatch || tagMatch || idMatch;
      });
    }

    // 2. Tab Filter / Sort
    if (activeFilter === 'popular') {
      return [...result].sort((a, b) => {
        const viewsA = getCleanViewCountForVideo(a.id) || a.views || a.views_count || 0;
        const viewsB = getCleanViewCountForVideo(b.id) || b.views || b.views_count || 0;
        return viewsB - viewsA;
      });
    }

    if (activeFilter === 'newest') {
      return [...result].sort((a, b) => {
        const timeA = new Date(a.published_at || a.created_at || 0).getTime();
        const timeB = new Date(b.published_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });
    }

    if (activeFilter.startsWith('cat:')) {
      const targetCat = activeFilter.replace('cat:', '').toLowerCase();
      return result.filter(v => v.category?.toLowerCase() === targetCat);
    }

    return result;
  }, [videos, cleanQuery, activeFilter]);

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

      {/* Recent Search History Directly Under Search Bar */}
      {recentSearches.length > 0 ? (
        <View style={styles.recentWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#9CA3AF" />
              <Text style={styles.recentTitle}>Recent Search History</Text>
            </View>
            <Pressable onPress={() => setRecentSearches([])}>
              <Text style={{ color: '#6366F1', fontSize: 11, fontWeight: '700' }}>Clear</Text>
            </Pressable>
          </View>
          <View style={styles.tagRow}>
            {recentSearches.map(item => (
              <Pressable
                key={item}
                style={styles.tag}
                onPress={() => {
                  setQuery(item);
                  addRecentSearch(item);
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

      {/* Horizontal Filter Bar (All, Popular, Newest, Categories) */}
      <View style={{ height: 48 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {filterTabs.map(tab => {
            const isActive = activeFilter === tab.id;
            const IconComponent = tab.icon;
            return (
              <Pressable
                key={tab.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(tab.id)}
              >
                <IconComponent
                  size={14}
                  color={isActive ? '#FFFFFF' : '#9CA3AF'}
                />
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
            : activeFilter !== 'all'
            ? `No videos found for ${activeFilter.replace('cat:', '')} filter.`
            : 'Type a title or paste a share link / code to watch.'
        }
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
