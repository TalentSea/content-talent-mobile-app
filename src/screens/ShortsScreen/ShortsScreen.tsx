import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, RotateCw, WifiOff } from 'lucide-react-native';
import { fetchShortsApi, ShortItem } from '../../services/api/shortsApi';
import { ShortCard } from './ShortCard';
import { ShortsCommentsModal } from './ShortsCommentsModal';
import { styles } from './styles';
import { useAppTheme } from '../../context/ThemeContext';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

const FlashListAny = FlashList as any;

/**
 * Shimmering skeleton screen for Shorts feed loading experience
 */
function ShortsSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.skeletonContainer}>
      {/* Mock Right Sidebar Buttons */}
      <View style={styles.skeletonSidebar}>
        {[1, 2, 3, 4, 5].map(i => (
          <Animated.View key={i} style={{ alignItems: 'center', opacity: pulseAnim }}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonTextLine} />
          </Animated.View>
        ))}
      </View>

      {/* Mock Bottom Title & Description */}
      <Animated.View style={[styles.skeletonBottomContent, { opacity: pulseAnim }]}>
        <View style={styles.skeletonTitleLine1} />
        <View style={styles.skeletonTitleLine2} />
      </Animated.View>
    </View>
  );
}

export function ShortsScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const isFocused = useIsFocused();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  const [shortsList, setShortsList] = useState<ShortItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [feedHeight, setFeedHeight] = useState(0);
  // Synchronized global mute state across all shorts in feed
  const [globalMuted, setGlobalMuted] = useState(false);
  const [activeCommentsShortId, setActiveCommentsShortId] = useState<number | null>(null);

  // Audio focus & lifecycle management: Pause playback when app is backgrounded or tab blurred
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  const isPlaybackAllowed = isFocused && appState === 'active';

  const loadShorts = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
        setErrorMessage(null);
      }
      const data = await fetchShortsApi(page, 15);
      if (page === 1) {
        setShortsList(data);
      } else {
        setShortsList(prev => [...prev, ...data]);
      }
    } catch (err: any) {
      console.warn('[ShortsScreen] Error loading shorts:', err);
      if (page === 1) {
        setErrorMessage('Check your connection');
      }
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
    <View style={[styles.container, { backgroundColor: theme.mainBackgroundColor || '#0F0F0F' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Header Bar */}
      <View style={styles.topHeaderBar}>
        {navigation?.canGoBack && navigation.canGoBack() && (
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft color={theme.primaryTextColor || '#FFFFFF'} size={24} />
          </Pressable>
        )}
        <Text style={[styles.headerTitle, { color: theme.primaryTextColor || '#FFFFFF' }]}>Shorts</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ShortsSkeleton />
      ) : errorMessage ? (
        <View style={styles.emptyContainer}>
          <WifiOff size={48} color="#94A3B8" />
          <Text style={{ color: theme.primaryTextColor || '#FFFFFF', fontSize: 17, fontWeight: '700', marginTop: 14 }}>
            Check your connection
          </Text>
          <Text style={{ color: theme.secondaryTextColor || '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 6, maxWidth: 280 }}>
            Could not reach the server. Please verify your connection or try again.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => loadShorts(1)}>
            <RotateCw size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : shortsList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: theme.secondaryTextColor || '#94A3B8', fontSize: 15, textAlign: 'center' }}>
            No Shorts available right now.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => loadShorts(1)}>
            <RotateCw size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{ flex: 1 }}
          onLayout={e => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 0 && h !== feedHeight) {
              setFeedHeight(h);
            }
          }}
        >
          <FlashListAny
            data={shortsList}
            keyExtractor={(item: ShortItem, idx: number) => `${item.id}-${idx}`}
            renderItem={({ item, index }: { item: ShortItem; index: number }) => (
              <ShortCard
                item={item}
                cardHeight={feedHeight > 0 ? feedHeight : WINDOW_HEIGHT - 65}
                isActive={index === activeIndex}
                isPlaybackAllowed={isPlaybackAllowed}
                isMuted={globalMuted}
                onToggleMute={() => setGlobalMuted(prev => !prev)}
                onOpenComments={(id: number) => setActiveCommentsShortId(id)}
                onLikeToggle={handleLikeToggle}
              />
            )}
            estimatedItemSize={feedHeight > 0 ? feedHeight : WINDOW_HEIGHT - 65}
            pagingEnabled
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primaryTextColor || '#FFFFFF'}
              />
            }
          />
        </View>
      )}

      {/* Shorts Comments Bottom Sheet Modal */}
      <ShortsCommentsModal
        visible={activeCommentsShortId !== null}
        shortId={activeCommentsShortId}
        onClose={() => setActiveCommentsShortId(null)}
        onCommentCountUpdate={handleCommentCountUpdate}
      />
    </View>
  );
}
