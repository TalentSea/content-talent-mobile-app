import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft } from 'lucide-react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { fetchShortsApi, ShortItem } from '../../services/api/shortsApi';
import { ShortCard } from './ShortCard';
import { ShortsCommentsModal } from './ShortsCommentsModal';
import { styles } from './styles';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

const FlashListAny = FlashList as any;

export function ShortsScreen({ navigation }: any) {
  const [shortsList, setShortsList] = useState<ShortItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeCommentsShortId, setActiveCommentsShortId] = useState<number | null>(null);

  const loadShorts = async (page: number = 1) => {
    try {
      if (page === 1) setLoading(true);
      const data = await fetchShortsApi(page, 15);
      if (page === 1) {
        setShortsList(data);
      } else {
        setShortsList(prev => [...prev, ...data]);
      }
    } catch (err) {
      console.warn('[ShortsScreen] Error loading shorts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadShorts(1);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstVisible = viewableItems[0];
      if (firstVisible && typeof firstVisible.index === 'number') {
        setActiveIndex(firstVisible.index);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const handleRefresh = () => {
    setRefreshing(true);
    loadShorts(1);
  };

  const handleLikeToggle = (shortId: number, isLiked: boolean, likesCount: number) => {
    setShortsList(prev =>
      prev.map(item =>
        item.id === shortId
          ? { ...item, isLiked, likesCount }
          : item
      )
    );
  };

  const handleCommentCountUpdate = (shortId: number, newCount: number) => {
    setShortsList(prev =>
      prev.map(item =>
        item.id === shortId
          ? { ...item, commentsCount: newCount }
          : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Header Bar */}
      <View style={styles.topHeaderBar}>
        {navigation?.canGoBack && navigation.canGoBack() && (
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFFFFF" size={24} />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>Shorts</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.emptyText}>Loading Shorts...</Text>
        </View>
      ) : shortsList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Shorts available right now.</Text>
        </View>
      ) : (
        <FlashListAny
          data={shortsList}
          keyExtractor={(item: ShortItem, idx: number) => `${item.id}-${idx}`}
          renderItem={({ item, index }: { item: ShortItem; index: number }) => (
            <ShortCard
              item={item}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(prev => !prev)}
              onOpenComments={(id: number) => setActiveCommentsShortId(id)}
              onLikeToggle={handleLikeToggle}
            />
          )}
          estimatedItemSize={WINDOW_HEIGHT}
          pagingEnabled
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
            />
          }
        />
      )}

      {/* Shorts Comments Bottom Sheet Modal */}
      <ShortsCommentsModal
        visible={activeCommentsShortId !== null}
        shortId={activeCommentsShortId}
        onClose={() => setActiveCommentsShortId(null)}
        onCommentCountUpdate={handleCommentCountUpdate}
      />

      {/* Permanent Bottom Navigation Bar */}
      <BottomNavBar activeTab="Shorts" navigation={navigation} />
    </View>
  );
}
