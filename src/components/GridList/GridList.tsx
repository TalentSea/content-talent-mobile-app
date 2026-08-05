import React from 'react';
import {
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { styles } from './styles';

export interface GridItem {
  id: string;
  title: string;
  views: string;
  uploadedAt?: string;
  duration?: string;
  thumbnail: any;
}

interface GridListProps {
  data: GridItem[];
  onItemPress: (item: GridItem) => void;
  numColumns?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const GridList: React.FC<GridListProps> = ({
  data,
  onItemPress,
  numColumns = 2,
  refreshing = false,
  onRefresh,
}) => {
  const renderCard = ({ item }: { item: GridItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => onItemPress(item)}
    >
      <View style={styles.thumbnailWrapper}>
        <Image source={item.thumbnail} style={styles.thumbnail} />
        {item.duration && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.duration}</Text>
          </View>
        )}
      </View>

      <View style={styles.metaContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.views}
          {item.uploadedAt ? ` • ${item.uploadedAt}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      renderItem={renderCard}
      contentContainerStyle={styles.listContainer}
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        ) : undefined
      }
    />
  );
};