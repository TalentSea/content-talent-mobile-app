import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { VideoCard } from '../../components/VideoCard/VideoCard';

export const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Full Card with Image and Merged Props */}
        <VideoCard
          title="music video"
          thumbnailUrl="https://picsum.photos/600/350"
          category="Pop"
          views="1.2M views"
          uploadedAt="2 days ago"
          durationText="03:45"
          progressPercent={60}
          isFavorite={true}
          onPress={() => console.log('Playing video...')}
          onFavoriteToggle={() => console.log('Toggled favorite!')}
        />

        {/* Skeleton Placeholder */}
        <VideoCard isEmpty />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 16 },
});