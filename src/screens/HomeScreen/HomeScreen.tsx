import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  StatusBar,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
// Styles import
import { styles } from './styles';

// Custom Components
import { CustomTabs } from '../../components/CustomTabs/CustomTabs';

import { GridList } from '../../components/GridList/GridList';


const CITY_IMG = require('../../assets/images/city.jpg');
const MOUNTAIN_IMG = require('../../assets/images/mountain.jpg');
const COAST_IMG = require('../../assets/coast.jpg');
const FOREST_IMG = require('../../assets/forest.jpg');
const IMAGE1_IMG = require('../../assets/image1.jpg');
const IMAGE2_IMG = require('../../assets/image2.jpg');

// ----------------------------------------------------
// Mock Data
// ----------------------------------------------------
const CATEGORY_TABS = ['All', 'Trending', 'Gaming', 'Technology', 'Documentary', 'Music'];

const MOCK_HORIZONTAL_VIDEOS = [
  {
    id: 'h1',
    title: 'Top 10 Mobile App Development Tips 2026',
    channelName: 'Tech Insider',
    views: '150K views',
    uploadedAt: '2 days ago',
    duration: '12:40',
    thumbnail: MOUNTAIN_IMG,
  },
  {
    id: 'h2',
    title: 'Mastering React Native UI Design',
    channelName: 'Code With Me',
    views: '320K views',
    uploadedAt: '1 week ago',
    duration: '08:15',
    thumbnail: CITY_IMG,
  },
  {
    id: 'h3',
    title: 'TypeScript Best Practices for Beginners',
    channelName: 'Dev Academy',
    views: '95K views',
    uploadedAt: '3 days ago',
    duration: '15:20',
    thumbnail: FOREST_IMG,
  },
];

const MOCK_VERTICAL_VIDEOS = [
  {
    id: 'v1',
    title: 'How CJP defeated BJP at Jantar Mantar Protests? | Detailed Analysis',
    channelName: 'Dhruv Rathee',
    views: '8.6M views',
    uploadedAt: '6 days ago',
    duration: '17:51',
    thumbnail: COAST_IMG,
  },
  {
    id: 'v2',
    title: 'What Happens After Death? | Does Aatma really Exist?',
    channelName: 'Dhruv Rathee',
    views: '9.7M views',
    uploadedAt: '11 days ago',
    duration: '24:51',
    thumbnail: IMAGE1_IMG,
  },
  {
    id: 'v3',
    title: 'React Native Mobile App Development Full Course',
    channelName: 'Tech Academy',
    views: '1.2M views',
    uploadedAt: '2 weeks ago',
    duration: '45:10',
    thumbnail: IMAGE2_IMG,
  },
];

// HomeScreen Component

export const HomeScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('All');
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handleVideoPress = (videoItem: GridListItem) => {
    navigation.navigate('PlayerScreen', { video: videoItem });
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Tabs Section */}
        <CustomTabs
          tabs={CATEGORY_TABS}
          activeTab={selectedTab}
          onSelectTab={(tabName) => setSelectedTab(tabName)}
        />

        <GridList
            data={[...MOCK_HORIZONTAL_VIDEOS, ...MOCK_VERTICAL_VIDEOS]} 
            numColumns={2}
            onItemPress={handleVideoPress}
        />
        {/* 1. SECTION 1: Horizontal Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Videos</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContainer}
        >
          {MOCK_HORIZONTAL_VIDEOS.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={styles.cardType1}
              onPress={() => handleVideoPress(item)}
            >
              <View style={styles.thumbnailWrapper}>
                <Image source={item.thumbnail} style={styles.thumbnail} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.duration}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.channelName} • {item.views}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2. SECTION 2: Vertical Feed Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Videos</Text>
        </View>

        {/* 3. SECTION 3: Vertical Feed */}
        <View style={styles.verticalContainer}>
          {MOCK_VERTICAL_VIDEOS.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={styles.cardType2}
              onPress={() => handleVideoPress(item)}>
              <View style={styles.thumbnailWrapperLarge}>
                <Image source={item.thumbnail} style={styles.thumbnail} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.duration}</Text>
                </View>
              </View>
              <View style={styles.cardMetaContainer}>
                <Text style={styles.cardTitleLarge} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardMeta}>
                  {item.channelName} • {item.views} • {item.uploadedAt}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};