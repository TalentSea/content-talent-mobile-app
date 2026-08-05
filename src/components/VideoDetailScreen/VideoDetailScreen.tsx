import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HorizontalCard } from '../HorizontalCard'; // Adjust path if needed
import { styles } from './styles';

export interface VideoItem {
  id?: string;
  title: string;
  views: string;
  uploadedAt?: string;
  duration?: string;
  thumbnail: any;
}

export interface VideoDetailScreenProps {
  video: VideoItem;
  relatedVideos: VideoItem[];
  onBackPress?: () => void;
  onRelatedVideoPress?: (item: VideoItem) => void;
}

export const VideoDetailScreen: React.FC<VideoDetailScreenProps> = ({
  video,
  relatedVideos,
  onBackPress,
  onRelatedVideoPress,
}) => {
  const [liked, setLiked] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* 1. Video Player Region */}
      <View style={styles.playerContainer}>
        {onBackPress && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={onBackPress}
          >
            <Text style={styles.backIconText}>‹</Text>
          </TouchableOpacity>
        )}

        <Image source={video.thumbnail} style={styles.playerImage} />

        <TouchableOpacity activeOpacity={0.8} style={styles.playButtonOverlay}>
          <Text style={styles.playIconText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Scrollable Detail & Content Area */}
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* Title & Metadata */}
        <View style={styles.metaSection}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.metaSubtext}>
            {video.views} {video.uploadedAt ? `• ${video.uploadedAt}` : ''}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionItem} onPress={() => setLiked(!liked)}>
            <Text style={styles.actionIconText}>👍</Text>
            <Text style={[styles.actionLabel, liked && { color: '#FFFFFF' }]}>
              {liked ? 'Liked' : 'Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIconText}>👎</Text>
            <Text style={styles.actionLabel}>Dislike</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIconText}>↗️</Text>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionIconText}>🔖</Text>
            <Text style={styles.actionLabel}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Preview Box */}
        <TouchableOpacity activeOpacity={0.8} style={styles.commentsPreviewBox}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Text style={styles.commentsCount}>248</Text>
          </View>
          <Text style={styles.commentSnippet} numberOfLines={1}>
            Great explanation as always! Looking forward to the next episode 🔥
          </Text>
        </TouchableOpacity>

        {/* Up Next / Related Videos Section */}
        <View style={styles.relatedHeader}>
          <Text style={styles.sectionTitle}>Up Next</Text>
        </View>

        {/* Using .map() instead of FlatList prevents VirtualizedLists error */}
        {relatedVideos.map((item) => (
          <HorizontalCard
            key={item.id || item.title}
            title={item.title}
            views={item.views}
            duration={item.duration}
            thumbnail={item.thumbnail}
            onPress={() => onRelatedVideoPress?.(item)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};