import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  Image,
  Text,
  Pressable,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import { Play, Film, Award } from 'lucide-react-native';
import type { ApiVideo } from '../../types/video';
import type { PlaylistListItem } from '../../services/api/playlistApi';
import type { MobileBrandingResponse } from '../../services/api/brandingApi';
import { API_BASE_URL } from '../../constants/config';
import { styles } from './styles';

const { width } = Dimensions.get('window');

export type HeroItem = {
  id: string | number;
  type: 'branding' | 'video' | 'playlist' | 'trailer';
  title: string;
  description: string;
  thumbnail_url: string;
  category?: string;
  duration?: string;
  badgeLabel?: string;
  creatorName?: string;
  creatorAvatar?: string;
  tagline?: string;
  rawVideo?: ApiVideo;
  rawPlaylist?: PlaylistListItem;
};

type HeroBannerProps = {
  video?: ApiVideo | null;
  heroItems?: HeroItem[];
  branding?: MobileBrandingResponse | null;
  onPlayVideo?: (video: ApiVideo) => void;
  onSelectPlaylist?: (playlistId: number, title: string) => void;
};

function resolveImageUrl(
  url?: string | null,
  fallback: string = '',
): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  let clean = url.trim();

  if (clean.includes('localhost:8000') || clean.includes('127.0.0.1:8000')) {
    clean = clean.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/g, API_BASE_URL);
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.startsWith('/')) {
    return `${API_BASE_URL}${clean}`;
  }
  return `${API_BASE_URL}/${clean}`;
}

function HeroBannerSlideItem({
  item,
  onPress,
}: {
  item: HeroItem;
  onPress: (item: HeroItem) => void;
}) {
  const [imgUri, setImgUri] = useState<string>(() => resolveImageUrl(item.thumbnail_url, ''));
  const [avatarUri, setAvatarUri] = useState<string>(() => resolveImageUrl(item.creatorAvatar, ''));

  useEffect(() => {
    setImgUri(resolveImageUrl(item.thumbnail_url, ''));
    setAvatarUri(resolveImageUrl(item.creatorAvatar, ''));
  }, [item.thumbnail_url, item.creatorAvatar]);

  return (
    <View style={styles.bannerSlide}>
      {imgUri ? (
        <Image
          source={{ uri: imgUri }}
          style={styles.backgroundImage}
          onError={() => setImgUri('')}
        />
      ) : null}
      <View style={styles.gradientOverlay}>
        {/* Top Badge Row: Category Pill on top right for featured videos */}
        {item.category && item.type !== 'branding' ? (
          <View style={styles.brandingBadgeRow}>
            <View style={styles.categoryPillBadge}>
              <Film size={11} color="#FFFFFF" />
              <Text style={styles.categoryPillText}>{item.category}</Text>
            </View>
          </View>
        ) : null}

        {/* Slide Content */}
        {item.type === 'branding' ? (
          <View style={styles.brandingHeaderContent}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.brandingLogo}
                onError={() => setAvatarUri('')}
              />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.brandingTitleText} numberOfLines={1}>
                {item.creatorName || item.title || 'Creator Studio'}
              </Text>
              {item.tagline ? (
                <Text style={styles.brandingTaglineText} numberOfLines={2}>
                  {item.tagline}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <>
            {/* Video Row: Thumbnail Circle (same 34x34 size) + Video Name beside it */}
            <View style={styles.creatorRow}>
              {imgUri ? (
                <Image
                  source={{ uri: imgUri }}
                  style={styles.creatorAvatar}
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.duration ? (
                  <Text style={styles.creatorBio}>Duration • {item.duration}</Text>
                ) : null}
              </View>
            </View>

            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </>
        )}

        {/* Action Button: Watch Now (Only for Video/Featured slides, NOT for Slide 1 Creator Banner) */}
        {item.type !== 'branding' ? (
          <View style={styles.buttonRow}>
            <Pressable style={styles.playButton} onPress={() => onPress(item)}>
              <Play size={14} color="#000000" fill="#000000" />
              <Text style={styles.playButtonText}>Watch Now</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function HeroBanner({
  video,
  heroItems = [],
  branding,
  onPlayVideo,
  onSelectPlaylist,
}: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const items: HeroItem[] = [];

  // 1. Add Studio Branding slide ONLY if branding API returns real creator data
  if (branding && (branding.creator_name || branding.banner_url || branding.logo_url)) {
    const bannerUri = resolveImageUrl(branding.banner_url, '');
    const logoUri = resolveImageUrl(branding.logo_url, '');
    items.push({
      id: 'hero_branding_0',
      type: 'branding',
      title: branding.creator_name || 'Creator Studio',
      tagline: branding.tagline || '',
      description: branding.description || '',
      thumbnail_url: bannerUri,
      creatorAvatar: logoUri,
      creatorName: branding.creator_name || 'Creator Studio',
      badgeLabel: 'STUDIO BRANDING',
      category: 'OFFICIAL',
    });
  }

  // 2. Add Featured Video slides from live API banners or uploaded videos
  if (heroItems && heroItems.length > 0) {
    items.push(...heroItems);
  } else if (video) {
    items.push({
      id: video.id,
      type: 'video',
      title: video.title,
      description: video.description || '',
      thumbnail_url: resolveImageUrl(video.main_thumbnail_url, ''),
      category: video.category || 'Featured',
      badgeLabel: 'SPOTLIGHT',
      duration: video.duration || '',
      creatorName: branding?.creator_name || 'Streamr',
      creatorAvatar: resolveImageUrl(branding?.logo_url, ''),
      rawVideo: video,
    });
  }

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % items.length;
        try {
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
        } catch (e) {
          // Safe catch for scroll
        }
        return next;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [items.length]);

  // If no live API branding or videos exist, return null (do not display mock data)
  if (items.length === 0) {
    return null;
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeIndex && index >= 0 && index < items.length) {
      setActiveIndex(index);
    }
  };

  const handleItemPress = (item: HeroItem) => {
    if (item.rawVideo && onPlayVideo) {
      onPlayVideo(item.rawVideo);
    } else if (item.rawPlaylist && onSelectPlaylist) {
      onSelectPlaylist(Number(item.rawPlaylist.id), item.rawPlaylist.name);
    } else if (onSelectPlaylist) {
      onSelectPlaylist(1, item.title);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={item => String(item.id)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={width - 32}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <HeroBannerSlideItem item={item} onPress={handleItemPress} />
        )}
      />

      <View style={styles.paginationDots}>
        {items.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex ? styles.activeDot : null]}
          />
        ))}
      </View>
    </View>
  );
}
