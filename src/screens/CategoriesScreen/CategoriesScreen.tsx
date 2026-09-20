import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { fetchUserCategoriesApi, MobileCategoryItem } from '../../services/api/userActivityApi';
import { useVideos } from '../../hooks/useVideo';
import { getThumbnailForVideo } from '../../utils/thumbnailUtils';
import { styles } from './styles';
import { CategoryGridSkeleton } from '../../components/SkeletonLoader/HotstarSkeleton';

type RealCategoryItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
  playlistsCount: number;
  accentColor: string;
  thumbnail: string;
  description?: string | null;
};

// Preset high-quality topic thumbnails and accent colors matching target design
const CATEGORY_PRESETS: Record<string, { accentColor: string; image: string; playlistsCount: number; description: string }> = {
  programming: {
    accentColor: '#818CF8',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop',
    playlistsCount: 6,
    description: 'Coding, web dev, and software engineering',
  },
  sports: {
    accentColor: '#34D399',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop',
    playlistsCount: 4,
    description: 'Match highlights, games, and athletic training',
  },
  travel: {
    accentColor: '#FBBF24',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop',
    playlistsCount: 3,
    description: 'Destinations, flight guides, and travel vlogs',
  },
  science: {
    accentColor: '#C084FC',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop',
    playlistsCount: 5,
    description: 'Discover physics, space, nature, and biology',
  },
  technology: {
    accentColor: '#F472B6',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop',
    playlistsCount: 8,
    description: 'Latest tech reviews, AI, and gadget news',
  },
  wellness: {
    accentColor: '#FB7185',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop',
    playlistsCount: 2,
    description: 'Health, yoga, meditation, and fitness',
  },
};

const DEFAULT_PRESET_LIST = [
  { slug: 'programming', name: 'Programming', count: 48, playlistsCount: 6, accentColor: '#818CF8', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop', description: 'Coding, web dev, and software engineering' },
  { slug: 'sports', name: 'Sports', count: 32, playlistsCount: 4, accentColor: '#34D399', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop', description: 'Match highlights, games, and athletic training' },
  { slug: 'travel', name: 'Travel', count: 27, playlistsCount: 3, accentColor: '#FBBF24', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop', description: 'Destinations, flight guides, and travel vlogs' },
  { slug: 'science', name: 'Science', count: 41, playlistsCount: 5, accentColor: '#C084FC', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop', description: 'Discover physics, space, nature, and biology' },
  { slug: 'technology', name: 'Technology', count: 56, playlistsCount: 8, accentColor: '#F472B6', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop', description: 'Latest tech reviews, AI, and gadget news' },
  { slug: 'wellness', name: 'Wellness', count: 19, playlistsCount: 2, accentColor: '#FB7185', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop', description: 'Health, yoga, meditation, and fitness' },
];

export function CategoriesScreen({ navigation }: any) {
  const { videos, loading: videosLoading, reload } = useVideos();
  const [categoriesList, setCategoriesList] = useState<RealCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRealBackendCategories() {
      try {
        setLoading(true);
        const apiCats = await fetchUserCategoriesApi();

        const catCounts: Record<string, number> = {};
        if (videos && videos.length > 0) {
          videos.forEach(v => {
            if (v.category && v.category.trim()) {
              const catKey = v.category.trim().toLowerCase();
              catCounts[catKey] = (catCounts[catKey] || 0) + 1;
            }
          });
        }

        let formattedList: RealCategoryItem[] = [];

        if (apiCats && apiCats.length > 0) {
          formattedList = apiCats.map((item: MobileCategoryItem, idx: number) => {
            const slugKey = (item.slug || item.name).toLowerCase();
            const preset = CATEGORY_PRESETS[slugKey] || {
              accentColor: '#818CF8',
              image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop',
              playlistsCount: Math.max(2, Math.floor((item.video_count || 10) / 4)),
              description: 'Explore content by category topic',
            };

            const matchingVideo = videos?.find(
              v =>
                v.category?.toLowerCase() === slugKey ||
                v.category?.toLowerCase() === item.name.toLowerCase()
            );
            const thumbImage = matchingVideo ? getThumbnailForVideo(matchingVideo) : preset.image;

            const countFromVideos =
              catCounts[slugKey] ||
              catCounts[item.name.toLowerCase()] ||
              (item.video_count && item.video_count > 0 ? item.video_count : 15);

            return {
              id: String(item.id || idx + 1),
              name: item.name,
              slug: item.slug,
              count: countFromVideos,
              playlistsCount: preset.playlistsCount,
              accentColor: preset.accentColor,
              thumbnail: thumbImage,
              description: item.description || preset.description,
            };
          });
        } else {
          // If no custom API categories, format default preset list
          formattedList = DEFAULT_PRESET_LIST.map((preset, idx) => {
            const realCount = catCounts[preset.slug] || catCounts[preset.name.toLowerCase()] || preset.count;
            const matchingVideo = videos?.find(v => v.category?.toLowerCase() === preset.slug);
            return {
              id: String(idx + 1),
              name: preset.name,
              slug: preset.slug,
              count: realCount,
              playlistsCount: preset.playlistsCount,
              accentColor: preset.accentColor,
              thumbnail: matchingVideo ? getThumbnailForVideo(matchingVideo) : preset.image,
              description: preset.description,
            };
          });
        }

        setCategoriesList(formattedList);
      } catch (err) {
        console.warn('[CategoriesScreen] Error loading real categories:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRealBackendCategories();
  }, [videos]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Screen Header matching screenshot */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#FFFFFF" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>Browse Categories</Text>
        </View>
        <Text style={styles.headerSubtitle}>Explore content by topic</Text>
      </View>

      {loading || videosLoading ? (
        <CategoryGridSkeleton />
      ) : categoriesList.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>
            No active categories available.
          </Text>
        </View>
      ) : (
        <FlatList
          data={categoriesList}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading || videosLoading}
              onRefresh={() => {
                setLoading(true);
                reload();
              }}
              tintColor="#FFFFFF"
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('CategoryDetail', {
                  category: item.name,
                  slug: item.slug,
                  description: item.description,
                })
              }
            >
              <Image source={{ uri: item.thumbnail }} style={styles.cardBackgroundImage} />
              <View style={styles.cardOverlay}>
                <View style={styles.cardHeaderContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={[styles.cardMetaText, { color: item.accentColor }]}>
                    {item.count} videos · {item.playlistsCount} playlists
                  </Text>
                </View>

                {/* Glass preview rectangle boxes matching screenshot */}
                <View style={styles.previewBoxesRow}>
                  <View style={styles.previewBox} />
                  <View style={styles.previewBox} />
                  <View style={styles.previewBox} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Permanent Bottom Navigation Bar */}
      <BottomNavBar activeTab="Categories" navigation={navigation} />
    </SafeAreaView>
  );
}
