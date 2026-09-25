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
import { styles } from './styles';
import { CategoryGridSkeleton } from '../../components/SkeletonLoader/HotstarSkeleton';

type RealCategoryItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
  accentColor: string;
  thumbnail: string;
  description?: string | null;
};

export function CategoriesScreen({ navigation }: any) {
  const [categoriesList, setCategoriesList] = useState<RealCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBackendCategories = async () => {
    try {
      setLoading(true);
      const apiCats = await fetchUserCategoriesApi();

      if (apiCats && apiCats.length > 0) {
        const formattedList: RealCategoryItem[] = apiCats.map((item: MobileCategoryItem, idx: number) => {
          const thumb = item.thumbnailUrl || (item as any).thumbnail || (item as any).image || (item as any).image_url || '';
          const count = item.contentCount ?? item.video_count ?? 0;
          const color = item.color || '#60A5FA';

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

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Screen Header matching design */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          {navigation?.canGoBack && navigation.canGoBack() && (
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <ChevronLeft color="#FFFFFF" size={22} />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>Browse Categories</Text>
        </View>
        <Text style={styles.headerSubtitle}>Explore content by topic</Text>
      </View>

      {loading ? (
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
              refreshing={loading}
              onRefresh={loadBackendCategories}
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
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.cardBackgroundImage} />
              ) : (
                <View style={[styles.cardBackgroundImage, { backgroundColor: item.accentColor + '33' }]} />
              )}
              
              {/* Semi-transparent overlay with color tint */}
              <View style={styles.cardOverlay}>
                <View style={styles.cardHeaderContent}>
                  {/* Category Name */}
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {/* Accent sub-meta line showing video count only */}
                  <Text style={[styles.cardMetaText, { color: item.accentColor }]} numberOfLines={1}>
                    {item.count} {item.count === 1 ? 'video' : 'videos'}
                  </Text>

                  {/* Two subtle translucent placeholder lines matching Image 2 */}
                  <View style={styles.skeletonBarLong} />
                  <View style={styles.skeletonBarShort} />
                </View>

                {/* Glass preview rectangle boxes matching Image 2 */}
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



