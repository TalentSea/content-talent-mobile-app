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
import { styles } from './styles';

const { width } = Dimensions.get('window');

export type HeroItem = {
  id: string | number;
  type: 'video' | 'playlist' | 'trailer';
  title: string;
  description: string;
  thumbnail_url: string;
  category?: string;
  duration?: string;
  badgeLabel?: string;
  creatorName?: string;
  creatorAvatar?: string;
  rawVideo?: ApiVideo;
  rawPlaylist?: PlaylistListItem;
};

type HeroBannerProps = {
  video?: ApiVideo | null;
  heroItems?: HeroItem[];
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

export function HeroBanner({
  video,
  heroItems,
  onPlayVideo,
  onSelectPlaylist,
}: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Combine provided items or build from video fallback
  const items: HeroItem[] = heroItems && heroItems.length > 0
    ? heroItems
    : video
      ? [
          {
            id: video.id,
            type: 'video',
            title: video.title,
            description: video.description || 'Featured high-definition video stream.',
            thumbnail_url: video.main_thumbnail_url || DEFAULT_HERO_ITEMS[0].thumbnail_url,
            category: video.category || 'Featured',
            badgeLabel: 'PLURALSIGHT SPOTLIGHT',
            duration: video.duration || 'Stream',
            creatorName: 'Alex OTT Creator',
            creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
            rawVideo: video,
          },
          ...DEFAULT_HERO_ITEMS.slice(1),
        ]
      : DEFAULT_HERO_ITEMS;

  useEffect(() => {
    // Auto-advance banner every 6 seconds
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

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const slideWidth = width - 32;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideWidth);
    if (index >= 0 && index < items.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  }

  function handleItemPress(item: HeroItem) {
    if (item.rawVideo && onPlayVideo) {
      onPlayVideo(item.rawVideo);
    } else if (item.rawPlaylist && onSelectPlaylist) {
      onSelectPlaylist(item.rawPlaylist.id, item.rawPlaylist.name);
    } else if (onPlayVideo && video) {
      onPlayVideo(video);
    }
  }

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
          <View style={styles.bannerSlide}>
            <Image
              source={{ uri: item.thumbnail_url }}
              style={styles.backgroundImage}
            />
            <View style={styles.gradientOverlay}>
              {/* Top Branding Row */}
              <View style={styles.brandingBadgeRow}>
                <View style={styles.pluralsightBadge}>
                  <Award size={12} color="#FFFFFF" />
                  <Text style={styles.pluralsightBadgeText}>
                    {item.badgeLabel || 'PLURALSIGHT PATH'}
                  </Text>
                </View>
                <View style={styles.clipBadge}>
                  <Text style={styles.clipBadgeText}>
                    🎬 {item.type === 'trailer' ? 'CLIP / TRAILER' : item.category || 'PREVIEW'}
                  </Text>
                </View>
              </View>

              {/* Creator Profile Row */}
              <View style={styles.creatorRow}>
                <Image
                  source={{ uri: item.creatorAvatar || 'https://via.placeholder.com/100' }}
                  style={styles.creatorAvatar}
                />
                <View>
                  <Text style={styles.creatorName}>{item.creatorName || 'OTT Master Creator'}</Text>
                  <Text style={styles.creatorBio}>Expert Instructor • {item.duration}</Text>
                </View>
              </View>

              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.playButton}
                  onPress={() => handleItemPress(item)}
                >
                  <Play size={14} color="#000000" fill="#000000" />
                  <Text style={styles.playButtonText}>Watch Now</Text>
                </Pressable>

                <Pressable
                  style={styles.trailerButton}
                  onPress={() => handleItemPress(item)}
                >
                  <Film size={14} color="#FFFFFF" />
                  <Text style={styles.trailerButtonText}>Clip / Trailer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      {/* Pagination Dots */}
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
