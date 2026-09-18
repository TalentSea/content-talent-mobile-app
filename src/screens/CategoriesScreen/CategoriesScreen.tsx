import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { fetchUserCategoriesApi, MobileCategoryItem } from '../../services/api/userActivityApi';
import { useVideos } from '../../hooks/useVideo';
import { styles } from './styles';
import { colors } from '../../constants/colors';

type RealCategoryItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
  color: string;
  icon?: string;
  description?: string | null;
};

const DEFAULT_CATEGORY_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Purple
  '#2563EB', // Blue
  '#DB2777', // Pink
  '#0891B2', // Cyan
];

import { CategoryGridSkeleton } from '../../components/SkeletonLoader/HotstarSkeleton';

export function CategoriesScreen({ navigation }: any) {
  const { videos, loading: videosLoading } = useVideos();
  const [categoriesList, setCategoriesList] = useState<RealCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRealBackendCategories() {
      try {
        setLoading(true);
        const apiCats = await fetchUserCategoriesApi();

        const catCounts: Record<string, number> = {};

        // Calculate real published video count per category slug / name from video catalog
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
            const countFromVideos =
              catCounts[item.slug.toLowerCase()] ||
              catCounts[item.name.toLowerCase()] ||
              (videos ? videos.filter(v => v.category?.toLowerCase() === item.slug.toLowerCase() || v.category?.toLowerCase() === item.name.toLowerCase()).length : 0);

            return {
              id: String(item.id || idx + 1),
              name: item.name,
              slug: item.slug,
              count: countFromVideos,
              color: item.color || DEFAULT_CATEGORY_COLORS[idx % DEFAULT_CATEGORY_COLORS.length],
              icon: item.icon,
              description: item.description || null,
            };
          });
        } else {
          // Fallback to categories present on live videos catalog
          const catalogCats = Object.keys(catCounts);
          formattedList = catalogCats.map((catKey, idx) => ({
            id: String(idx + 1),
            name: catKey.charAt(0).toUpperCase() + catKey.slice(1),
            slug: catKey,
            count: catCounts[catKey] || 0,
            color: DEFAULT_CATEGORY_COLORS[idx % DEFAULT_CATEGORY_COLORS.length],
            description: null,
          }));
        }

        // Show active categories with published videos or live API records
        const activeCategories = formattedList.filter(item => item.count > 0 || apiCats.length > 0);

        setCategoriesList(activeCategories);
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

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.text} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading || videosLoading ? (
        <CategoryGridSkeleton />
      ) : categoriesList.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>
            No active categories published yet in backend feed.
          </Text>
        </View>
      ) : (
        <FlatList
          data={categoriesList}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: item.color }]}
              onPress={() =>
                navigation.navigate('CategoryDetail', {
                  category: item.name,
                  slug: item.slug,
                  description: item.description,
                })
              }
            >
              <View style={styles.cardHeaderContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.icon ? `${item.icon} ` : ''}
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.cardMeta}>
                {item.count} {item.count === 1 ? 'Video' : 'Videos'}
              </Text>
            </Pressable>
          )}
        />
      )}

      {/* Permanent Bottom Navigation Bar */}
      <BottomNavBar activeTab="Categories" navigation={navigation} />
    </SafeAreaView>
  );
}
