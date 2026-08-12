import React from 'react';
import { Image, Text, Pressable, View } from 'react-native';
import { Play } from 'lucide-react-native';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

type CreatorProfile = {
  name: string;
  avatar_url?: string;
  bio?: string;
};

type HeroBannerProps = {
  video: ApiVideo | null;
  creator?: CreatorProfile | null;
  onPlay?: (video: ApiVideo) => void;
};

const DEFAULT_CREATOR: CreatorProfile = {
  name: 'Alex OTT Creator',
  avatar_url: 'https://via.placeholder.com/100x100/6366F1/FFFFFF?text=A',
  bio: 'Streaming high-quality OTT content & tech tutorials.',
};

export function HeroBanner({
  video,
  creator = DEFAULT_CREATOR,
  onPlay,
}: HeroBannerProps) {
  if (!video) return null;

  const creatorName = creator?.name || DEFAULT_CREATOR.name;
  const creatorAvatar = creator?.avatar_url || DEFAULT_CREATOR.avatar_url;
  const creatorBio = creator?.bio || DEFAULT_CREATOR.bio;

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            video.main_thumbnail_url ||
            'https://via.placeholder.com/800x450/1A1A2E/FFFFFF?text=Featured+Video',
        }}
        style={styles.backgroundImage}
      />
      <View style={styles.gradientOverlay}>
        {/* Creator Admin Profile Bar */}
        <View style={styles.creatorRow}>
          <Image source={{ uri: creatorAvatar }} style={styles.creatorAvatar} />
          <View>
            <Text style={styles.creatorName}>{creatorName}</Text>
            {creatorBio ? (
              <Text style={styles.creatorBio} numberOfLines={1}>
                {creatorBio}
              </Text>
            ) : null}
          </View>
        </View>

        {video.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{video.category}</Text>
          </View>
        ) : null}

        <Text style={styles.title} numberOfLines={1}>
          {video.title}
        </Text>

        <View style={styles.buttonRow}>
          <Pressable
            style={styles.playButton}
            onPress={() => onPlay && onPlay(video)}
          >
            <Play size={14} color="#000000" fill="#000000" />
            <Text style={styles.playButtonText}>Watch Now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
