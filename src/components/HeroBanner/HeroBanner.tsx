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

const DEFAULT_HERO_ITEMS: HeroItem[] = [
  {
    id: 'hero_1',
    type: 'video',
    title: 'React Native Architecture & Performance Masterclass',
    description: 'Elevate your mobile apps with Fabric renderer, TurboModules, and zero-bridge native execution.',
    thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    category: 'Development',
    badgeLabel: 'PLURALSIGHT PATH',
    duration: '22:15',
    creatorName: 'Alex OTT Creator',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'hero_2',
    type: 'trailer',
    title: 'Tears of Steel - Official Sci-Fi Open Movie Trailer',
    description: 'Watch the high-octane 4K HLS trailer featuring VFX powered by open-source technology.',
    thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    category: 'Sci-Fi',
    badgeLabel: 'FEATURED TRAILER',
    duration: '02:30',
    creatorName: 'Blender Foundation',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'hero_3',
    type: 'playlist',
    title: 'FastAPI Microservices & Video Backend Series',
    description: 'Complete backend learning track covering HLS encoding, Auth0 JWT security, and SQLite ORMs.',
    thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    category: 'Backend',
    badgeLabel: 'CURATED PLAYLIST',
    duration: '5 Playlists',
    creatorName: 'Streamr Tech Lab',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
  },
];

function resolveImageUrl(
  url?: string | null,
  fallback: string = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
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
  const defaultFallback = item.type === 'branding'
    ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
    : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';

  const [imgUri, setImgUri] = useState<string>(() => resolveImageUrl(item.thumbnail_url, defaultFallback));
  const [avatarUri, setAvatarUri] = useState<string>(() => resolveImageUrl(item.creatorAvatar, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'));

  useEffect(() => {
    setImgUri(resolveImageUrl(item.thumbnail_url, defaultFallback));
    setAvatarUri(resolveImageUrl(item.creatorAvatar, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'));
  }, [item.thumbnail_url, item.creatorAvatar]);

  return (
    <View style={styles.bannerSlide}>
      <Image
        source={{ uri: imgUri }}
        style={styles.backgroundImage}
        onError={() => setImgUri(defaultFallback)}
      />
      <View style={styles.gradientOverlay}>
        {/* Top Badges (Pluralsight Path & Category) */}
        <View style={styles.brandingBadgeRow}>
          <View style={styles.pluralsightBadge}>
            <Award size={12} color="#FFFFFF" />
            <Text style={styles.pluralsightBadgeText}>
              {item.badgeLabel || 'FEATURED SPOTLIGHT'}
            </Text>
          </View>
          <View style={styles.clipBadge}>
            <Text style={styles.clipBadgeText}>
              🎬 {item.type === 'trailer' ? 'CLIP / TRAILER' : item.category || 'PREVIEW'}
            </Text>
          </View>
        </View>

        {/* Studio Branding / Creator Profile Row */}
        {item.type === 'branding' ? (
          <View style={styles.brandingHeaderContent}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.brandingLogo}
              onError={() => setAvatarUri('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80')}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.brandingTitleText} numberOfLines={1}>
                {item.creatorName || item.title || 'Naa Anveshana'}
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
            <View style={styles.creatorRow}>
              <Image
                source={{ uri: avatarUri }}
                style={styles.creatorAvatar}
                onError={() => setAvatarUri('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80')}
              />
              <View>
                <Text style={styles.creatorName}>{item.creatorName || 'OTT Master Creator'}</Text>
                {item.duration ? (
                  <Text style={styles.creatorBio}>Duration • {item.duration}</Text>
                ) : null}
              </View>
            </View>

            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </>
        )}

        {/* Action Buttons: Watch Now & Clip / Trailer */}
        <View style={styles.buttonRow}>
          <Pressable style={styles.playButton} onPress={() => onPress(item)}>
            <Play size={14} color="#000000" fill="#000000" />
            <Text style={styles.playButtonText}>Watch Now</Text>
          </Pressable>

          <Pressable style={styles.trailerButton} onPress={() => onPress(item)}>
            <Film size={14} color="#FFFFFF" />
            <Text style={styles.trailerButtonText}>Clip / Trailer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function HeroBanner({
  video,
  heroItems,
  branding,
  onPlayVideo,
  onSelectPlaylist,
}: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const fallbackBanner = (heroItems && heroItems.length > 0 && heroItems[0].thumbnail_url)
    ? heroItems[0].thumbnail_url
    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

  const bannerImageUri = resolveImageUrl(
    branding?.banner_url || (branding as any)?.creator_banner || (branding as any)?.cover_banner,
    fallbackBanner,
  );

  const logoImageUri = resolveImageUrl(
    branding?.logo_url || (branding as any)?.creator_logo || (branding as any)?.logo,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  );

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

  // If no live API branding or videos exist, return null (do not display mock data)
  if (items.length === 0) {
    return null;
  }

  useEffect(() => {
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
      onSelectPlaylist(Number(item.rawPlaylist.id), item.rawPlaylist.title);
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
