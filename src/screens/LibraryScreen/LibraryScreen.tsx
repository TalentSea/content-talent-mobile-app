import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, ChevronLeft, Download, Heart, History } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { styles } from './styles';
import { useLibrary } from '../../contexts/LibraryContext';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import type { PlayInfo } from '../../../types/video';
import { NativeVideoPlayer } from '../../components/NativeVideoPlayer';
import { isUserSubscribed } from '../../services/api/authService';

export function LibraryScreen({ route, navigation }: any) {
  const { items } = useLibrary();
  const [playingVideo, setPlayingVideo] = useState<PlayInfo | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<PlayInfo | null>(null);
  const type = route.params?.type ?? 'history';
  const content = {
    history: {
      Icon: History,
      title: 'Watch History',
      emptyTitle: 'No watch history yet',
      description: 'Videos you watch will appear here so you can pick up where you left off.',
    },
    downloads: {
      Icon: Download,
      title: 'Downloads',
      emptyTitle: 'No downloads yet',
      description: 'Videos you download for offline viewing will appear here.',
    },
    liked: {
      Icon: Heart,
      title: 'Liked Videos',
      emptyTitle: 'No liked videos yet',
      description: 'Videos you like will be saved here for easy access.',
    },
    saved: {
      Icon: Bookmark,
      title: 'Saved Videos',
      emptyTitle: 'No saved videos yet',
      description: 'Save a video to return to it later.',
    },
  }[type as 'history' | 'downloads' | 'liked' | 'saved'];
  const { Icon, title, emptyTitle, description } = content;
  const videos = items[type as 'history' | 'downloads' | 'liked' | 'saved'];
  const isCollection = type !== 'history';
  const featuredVideo = selectedVideo || videos[0];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={10}>
          <ChevronLeft color={colors.text} size={25} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {videos.length && isCollection ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.collectionContent}>
          <View style={styles.playerArea}>
            {isUserSubscribed() ? (
              <NativeVideoPlayer
                uri={featuredVideo.stream_url}
                mp4Url={featuredVideo.mp4Url}
                downloadUrls={featuredVideo.downloadUrls}
                title={featuredVideo.title}
                captions={featuredVideo.captions}
                inbuiltCaptionTracks={featuredVideo.inbuiltCaptionTracks}
                hasInbuiltCaptions={featuredVideo.hasInbuiltCaptions}
                adTagUrl={featuredVideo.adTagUrl}
                autoStart
                controls
                resizeMode="cover"
              />
            ) : (
              <View style={{ flex: 1, backgroundColor: '#101018', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14, marginBottom: 4 }}>
                  Subscription Required
                </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>
                  Subscribe to a plan to stream this collection.
                </Text>
                <Pressable
                  style={{ backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>Subscribe Now</Text>
                </Pressable>
              </View>
            )}
          </View>
          <Text style={styles.upNextTitle}>More in {title}</Text>
          {videos.filter(video => video.stream_url !== featuredVideo.stream_url).map(video => (
            <Pressable key={video.stream_url} style={styles.videoRow} onPress={() => setSelectedVideo(video)}>
              {video.poster ? <Image source={{ uri: video.poster }} style={styles.thumbnail} /> : <View style={styles.thumbnailFallback} />}
              <View style={styles.videoCopy}>
                <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                <Text style={styles.videoDescription} numberOfLines={1}>{video.description || 'Streamr video'}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : videos.length ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {videos.map(video => (
            <Pressable key={video.stream_url} style={styles.videoRow} onPress={() => setPlayingVideo(video)}>
              {video.poster ? <Image source={{ uri: video.poster }} style={styles.thumbnail} /> : <View style={styles.thumbnailFallback} />}
              <View style={styles.videoCopy}>
                <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                <Text style={styles.videoDescription} numberOfLines={1}>{video.description || 'Streamr video'}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
      <View style={styles.emptyState}>
        <View style={styles.iconWrap}>
          <Icon color={colors.primary} size={30} />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyDescription}>{description}</Text>
        <Pressable style={styles.exploreButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.exploreButtonText}>Explore videos</Text>
        </Pressable>
      </View>
      )}
      {!isCollection ? (
        <PlayerModal
          playingVideo={playingVideo}
          onUpgradeSubscription={() => {
            setPlayingVideo(null);
            navigation.navigate('Subscription');
          }}
          onClose={() => setPlayingVideo(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}
