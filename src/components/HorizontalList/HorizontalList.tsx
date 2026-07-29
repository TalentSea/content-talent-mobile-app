import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { FeedItem } from './types';
import CardType1 from '../VideoCard/CardType1';

interface HorizontalListProps {
  sectionTitle: string;
  data: FeedItem[];
  aspectRatio?: '16:9' | '2:3' | '1:1';
  cardWidth?: number;
  onItemPress?: (item: FeedItem) => void;
}

export const HorizontalList: React.FC<HorizontalListProps> = ({
  sectionTitle,
  data,
  aspectRatio = '16:9',
  cardWidth = 200,
  onItemPress,
}) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      <FlatList
        horizontal
        data={data}
        renderItem={({ item }) => (
          <CardType1
            item={item}
            aspectRatio={aspectRatio}
            width={cardWidth}
            onPress={() => onItemPress?.(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listPadding}
      />
    </View>
  );
};

export default HorizontalList;

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  listPadding: {
    paddingHorizontal: 16,
  },
});