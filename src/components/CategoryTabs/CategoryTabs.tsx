import React from 'react';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { styles } from './styles';

type CategoryTabsProps = {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {categories.map(category => {
          const isActive = category === selectedCategory;
          return (
            <Pressable
              key={category}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onSelectCategory(category)}
            >
              <Text
                style={[styles.tabText, isActive && styles.activeTabText]}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
