import React, { useEffect, useState, useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search } from 'lucide-react-native';
import { fetchUserCategoriesApi, MobileCategoryItem } from '../../services/api/userActivityApi';
import { styles } from './styles';
import { CategoryGridSkeleton } from '../../components/SkeletonLoader/HotstarSkeleton';
import { useAppTheme } from '../../contexts/ThemeContext';

// Rotating accent colors — applied by index so each category card has a distinct color
const ACCENT_COLORS = [
  '#818CF8', '#34D399', '#FBBF24', '#C084FC',
  '#F472B6', '#FB7185', '#38BDF8', '#4ADE80',
];

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
  accentColor: string;
  thumbnail: string;
  description?: string | null;
};

export function CategoriesScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadBackendCategories = async () => {
    try {
      setLoading(true);
      const apiCats = await fetchUserCategoriesApi();

      if (apiCats && apiCats.length > 0) {
        const formattedList: CategoryItem[] = apiCats.map((item: MobileCategoryItem, idx: number) => {
          const thumb = item.thumbnailUrl || (item as any).thumbnail || (item as any).image || (item as any).image_url || '';
          const count = item.contentCount ?? item.video_count ?? 0;
          const color = item.color || ACCENT_COLORS[idx % ACCENT_COLORS.length];

          return {
            id: String(item.id || idx + 1),
            name: item.name,
            slug: item.slug,
            count: count,
            accentColor: color,
            thumbnail: thumb,
            description: item.description || null,
          };
        });

        setCategoriesList(formattedList);
      } else {
        setCategoriesList([]);
      }
    } catch (err) {
      console.warn('[CategoriesScreen] Error loading real categories:', err);
      setCategoriesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackendCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoriesList;
    const q = searchQuery.toLowerCase().trim();
    return categoriesList.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
  }, [categoriesList, searchQuery]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.mainBackgroundColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.mainBackgroundColor} />

      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          {navigation?.canGoBack && navigation.canGoBack() && (
            <Pressable style={[styles.backButton, { backgroundColor: theme.cardBackgroundColor }]} onPress={() => navigation.goBack()}>
              <ChevronLeft color={theme.primaryTextColor} size={22} />
            </Pressable>
          )}
          <Text style={[styles.headerTitle, { color: theme.primaryTextColor }]}>Browse Categories</Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.secondaryTextColor }]}>Explore content by topic</Text>
      </View>

      {/* Search Bar (Restored from incoming branch) */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackgroundColor }]}>
          <Search color={theme.mutedTextColor} size={16} />
          <TextInput
            style={[styles.searchInput, { color: theme.primaryTextColor }]}
            placeholder="Search categories..."
            placeholderTextColor={theme.mutedTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearSearchText, { color: theme.primaryColor }]}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <CategoryGridSkeleton />
      ) : filteredCategories.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: theme.secondaryTextColor, fontSize: 14, textAlign: 'center' }}>
            {searchQuery
              ? `No categories found matching "${searchQuery}"`
              : 'No active categories available.'}
          </Text>
          {searchQuery.length > 0 && (
            <Pressable style={styles.resetSearchBtn} onPress={() => setSearchQuery('')}>
              <Text style={[styles.resetSearchText, { color: theme.primaryColor }]}>Show all categories</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadBackendCategories}
              tintColor={theme.primaryColor}
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
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.cardBackgroundImage} />
              ) : (
                <View style={[styles.cardBackgroundImage, { backgroundColor: item.accentColor + '33' }]} />
              )}
              
              {/* Semi-transparent overlay with color tint (from teammate's branch) */}
              <View style={styles.cardOverlay}>
                <View style={styles.cardHeaderContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.cardMetaText, { color: item.accentColor }]} numberOfLines={1}>
                    {item.count} {item.count === 1 ? 'video' : 'videos'}
                  </Text>
                  <View style={styles.skeletonBarLong} />
                  <View style={styles.skeletonBarShort} />
                </View>

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
    </SafeAreaView>
  );
}
