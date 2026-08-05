import React from 'react';
import { View, FlatList } from 'react-native';
// Clean import directly from CardType2 folder or VideoCard index
import { CardType2 } from '../VideoCard/CardType2/CardType2';
import { styles } from './styles';

interface VerticalListProps {
  data: any[];
  onItemPress?: (item: any) => void;
}

export const VerticalList: React.FC<VerticalListProps> = ({ data, onItemPress }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CardType2
            data={item}
            onPress={() => onItemPress && onItemPress(item)}
          />
        )}
      />
    </View>
  );
};