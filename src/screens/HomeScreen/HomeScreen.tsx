import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HorizontalList } from '../../components/HorizontalList';
import { FeedItem } from '../../components/HorizontalList/types';
import { styles } from './styles';

const CONTINUE_WATCHING_DATA: FeedItem[] = [
  {
    id: 'cw-1',
    thumbnailUrl: require('../../assets/images/city.jpg'),
    title: 'Planet Earth II: Wilderness',
    category: 'Documentary',
    durationText: '15:02',
    progressPercent: 65,
    metaString: 'S1 E3 • Nature',
  },
  {
    id: 'cw-2',
    thumbnailUrl: require('../../assets/images/mountain.jpg'),
    title: 'Formula 1: Drive to Survive S5',
    category: 'Sports',
    durationText: '32:15',
    progressPercent: 40,
    metaString: 'S5 E8 • Racing',
  },
  {
    id: 'cw-3',
    thumbnailUrl: require('../../assets/coast.jpg'),
    title: 'Silicon Valley AI Breakthroughs',
    category: 'Technology',
    durationText: '08:45',
    progressPercent: 85,
    metaString: 'S2 E1 • Tech',
  },
];

const POPULAR_VIDEOS_DATA: FeedItem[] = [
  {
    id: 'pop-1',
    thumbnailUrl: require('../../assets/forest.jpg'),
    title: "World's Fastest Bullet Trains",
    category: 'Engineering',
    durationText: '1:45:20',
    metaString: '2.4M views • 3 weeks ago',
  },
  {
    id: 'pop-2',
    thumbnailUrl: require('../../assets/image1.jpg'),
    title: 'Deep Ocean Trench Exploration',
    category: 'Science',
    durationText: '52:10',
    metaString: '890K views • 1 month ago',
  },
  {
    id: 'pop-3',
    thumbnailUrl: require('../../assets/image2.jpg'),
    title: 'Mastering Italian Culinary Arts',
    category: 'Food',
    durationText: '2:15:00',
    metaString: '1.2M views • 2 months ago',
  },
];

const REGIONAL_POSTERS_DATA: FeedItem[] = [
  {
    id: 'post-1',
    thumbnailUrl: require('../../assets/images/city.jpg'),
    title: 'RRR (Rise Roar Revolt)',
    category: 'Action / Drama',
    durationText: '3:07:00',
    metaString: '2022',
    overlayBadgeText: 'NEW',
  },
  {
    id: 'post-2',
    thumbnailUrl: require('../../assets/images/mountain.jpg'),
    title: 'Kantara',
    category: 'Action / Thriller',
    durationText: '2:28:15',
    metaString: '2022',
    overlayBadgeText: 'NEW',
  },
  {
    id: 'post-3',
    thumbnailUrl: require('../../assets/coast.jpg'),
    title: 'Pushpa 2: The Rule',
    category: 'Action / Crime',
    durationText: '3:20:00',
    metaString: '2024',
    overlayBadgeText: 'TOP 10',
  },
  {
    id: 'post-4',
    thumbnailUrl: require('../../assets/forest.jpg'),
    title: 'Kalki 2898 AD',
    category: 'Sci-Fi / Action',
    durationText: '3:01:00',
    metaString: '2024',
    overlayBadgeText: 'NEW',
  },
];

const HomeScreen: React.FC = () => {
  const handleItemPress = (item: FeedItem) => {
    console.log('Selected item:', item.title);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.logoText}>
          STREAM<Text style={styles.logoHighlight}>FLIX</Text>
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Row 1: Continue Watching */}
        <HorizontalList
          sectionTitle="Continue Watching"
          data={CONTINUE_WATCHING_DATA}
          aspectRatio="16:9"
          cardWidth={220}
          onItemPress={handleItemPress}
        />

        {/* Row 2: Popular Videos */}
        <HorizontalList
          sectionTitle="Popular Videos"
          data={POPULAR_VIDEOS_DATA}
          aspectRatio="16:9"
          cardWidth={200}
          onItemPress={handleItemPress}
        />

        {/* Row 3: Regional Blockbusters */}
        <HorizontalList
          sectionTitle="Regional Blockbusters"
          data={REGIONAL_POSTERS_DATA}
          aspectRatio="2:3"
          cardWidth={130}
          onItemPress={handleItemPress}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;