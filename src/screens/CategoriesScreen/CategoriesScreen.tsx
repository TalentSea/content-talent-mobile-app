import React from 'react';
import {
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavBar } from '../../components/BottomNavBar';
import { styles } from './styles';

type CategoryItem = {
  id: string;
  name: string;
  count: number;
  color: string;
};

const CATEGORIES: CategoryItem[] = [
  { id: '1', name: 'Technology', count: 24, color: '#4F46E5' },
  { id: '2', name: 'Tutorials', count: 18, color: '#059669' },
  { id: '3', name: 'Education', count: 12, color: '#D97706' },
  { id: '4', name: 'Popular', count: 35, color: '#DC2626' },
  { id: '5', name: 'Processing', count: 6, color: '#7C3AED' },
  { id: '6', name: 'Entertainment', count: 15, color: '#2563EB' },
];

export function CategoriesScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() =>
              navigation.navigate('CategoryDetail', { category: item.name })
            }
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>{item.count} Videos</Text>
          </Pressable>
        )}
      />

      {/* Permanent Bottom Navigation Bar */}
      <BottomNavBar activeTab="Categories" navigation={navigation} />
    </SafeAreaView>
  );
}
