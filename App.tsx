import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NativeVideoPlayer from './NativeVideoPlayer';


const BASE_URL = 'http://138.68.140.83:8000';

type ApiVideo = {
  id: number;
  user_id?: number;
  bunny_video_id?: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  thumbnail_url?: string;
  alt_thumbnails?: string[];
  status: 'pending' | 'processing' | 'ready' | 'failed' | string;
};

type PlayInfo = {
  title: string;
  description?: string;
  stream_url: string;
  poster?: string;
};

type SectionKey = 'popular' | 'processing';

export default function App() {
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playingVideo, setPlayingVideo] = useState<PlayInfo | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);

  useEffect(() => {
    loadVideos();

    const interval = setInterval(() => {
      loadVideos(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  async function loadVideos(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError('');

      const response = await fetch(`${BASE_URL}/api/v1/videos`);

      if (!response.ok) {
        throw new Error('Failed to load videos');
      }

      const data: ApiVideo[] = await response.json();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function playVideo(video: ApiVideo) {
    if (video.status !== 'ready') {
      return;
    }

    try {
      setPlayerLoading(true);

      const response = await fetch(`${BASE_URL}/api/v1/videos/${video.id}/play`);

      if (!response.ok) {
        throw new Error('Playback URL unavailable');
      }

      const data: PlayInfo = await response.json();
      console.log('PLAY INFO:', data);
      setPlayingVideo({ ...data, title: data.title || video.title });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play video');
    } finally {
      setPlayerLoading(false);
    }
  }

  const popularVideos = videos.filter(
    video => String(video.status).trim().toLowerCase() === 'ready',
  );

  const processingVideos = videos.filter(
    video => String(video.status).trim().toLowerCase() !== 'ready',
  );

  const sectionData: Record<
    SectionKey,
    { title: string; videos: ApiVideo[]; emptyText?: string }
  > = {
    popular: { title: 'Popular Videos', videos: popularVideos },
    processing: {
      title: 'Processing',
      videos: processingVideos,
      emptyText: 'No processing videos.',
    },
  };

  // Full-screen "See all" grid for a section
  if (expandedSection) {
    const section = sectionData[expandedSection];

    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.expandedHeader}>
          <Pressable
            style={styles.backButton}
            onPress={() => setExpandedSection(null)}
            hitSlop={10}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.expandedTitle}>{section.title}</Text>
          <View style={styles.backButtonSpacer} />
        </View>

        {section.videos.length === 0 ? (
          <Text style={styles.emptyText}>{section.emptyText || 'No videos found.'}</Text>
        ) : (
          <FlatList
            data={section.videos}
            keyExtractor={item => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => (
              <VideoCard
                video={item}
                onPress={() => playVideo(item)}
                fullWidth
              />
            )}
          />
        )}

        <PlayerModal
          playingVideo={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />

        {playerLoading ? (
          <View style={styles.playerLoading}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Streamr</Text>
          <Pressable onPress={() => loadVideos()}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading videos...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <VideoSection
          title="Popular Videos"
          videos={popularVideos}
          onPressVideo={playVideo}
          onSeeAll={() => setExpandedSection('popular')}
        />

        <VideoSection
          title="Processing"
          videos={processingVideos}
          onPressVideo={playVideo}
          onSeeAll={() => setExpandedSection('processing')}
          emptyText="No processing videos."
        />
      </ScrollView>

      <PlayerModal
        playingVideo={playingVideo}
        onClose={() => setPlayingVideo(null)}
      />

      {playerLoading ? (
        <View style={styles.playerLoading}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function PlayerModal({
  playingVideo,
  onClose,
}: {
  playingVideo: PlayInfo | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={!!playingVideo}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.playerScreen}>
        <StatusBar barStyle="light-content" hidden />

        <View style={styles.playerVideoArea}>
          {playingVideo ? (
            <NativeVideoPlayer
              uri={playingVideo.stream_url}
              style={styles.videoPlayer}
              onClose={onClose}
            />
          ) : null}
        </View>

        {playingVideo ? (
          <View style={styles.playerInfo}>
            <Text style={styles.playerTitle} numberOfLines={2}>
              {playingVideo.title}
            </Text>
            {playingVideo.description ? (
              <Text style={styles.playerDescription} numberOfLines={4}>
                {playingVideo.description}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function VideoSection({
  title,
  videos,
  onPressVideo,
  onSeeAll,
  emptyText = 'No videos found.',
}: {
  title: string;
  videos: ApiVideo[];
  onPressVideo: (video: ApiVideo) => void;
  onSeeAll: () => void;
  emptyText?: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {videos.length > 0 ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        ) : null}
      </View>

      {videos.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        <FlatList
          horizontal
          data={videos}
          keyExtractor={item => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          renderItem={({ item }) => (
            <VideoCard video={item} onPress={() => onPressVideo(item)} />
          )}
        />
      )}
    </View>
  );
}

function VideoCard({
  video,
  onPress,
  fullWidth = false,
}: {
  video: ApiVideo;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  const category = video.category || 'Video';
  const tags = video.tags?.length ? video.tags.slice(0, 2).join(', ') : 'Streamr';
  const isReady = video.status === 'ready';

  return (
    <Pressable
      style={[styles.card, fullWidth ? styles.cardFullWidth : null]}
      onPress={onPress}>
      <View
        style={[
          styles.thumbnailWrap,
          fullWidth ? styles.thumbnailWrapFullWidth : null,
        ]}>
        <Image
          source={{
            uri:
              video.thumbnail_url ||
              'https://via.placeholder.com/400x240?text=No+Thumbnail',
          }}
          style={styles.thumbnail}
        />

        <View style={styles.playBadge}>
          <Text style={styles.playIcon}>{isReady ? '▶' : '…'}</Text>
        </View>

        {!isReady ? (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{video.status}</Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={1} style={styles.videoTitle}>
        {video.title}
      </Text>

      <View style={styles.metaRow}>
        <Text numberOfLines={1} style={styles.category}>
          {category}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text numberOfLines={1} style={styles.meta}>
          {tags}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#05050A',
  },

  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  appTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  refreshText: {
    color: '#FF245E',
    fontSize: 12,
    fontWeight: '800',
  },

  loadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  loadingText: {
    color: '#9A9AA3',
    marginTop: 8,
    fontSize: 12,
  },

  errorText: {
    color: '#FF4D6D',
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '700',
  },

  section: {
    marginTop: 12,
  },

  sectionHeader: {
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  seeAll: {
    color: '#FF245E',
    fontSize: 10,
    fontWeight: '800',
  },

  row: {
    paddingLeft: 14,
    paddingRight: 8,
  },

  // ---- Expanded "See all" grid screen ----
  expandedHeader: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#15151F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonSpacer: {
    width: 36,
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: -2,
  },

  expandedTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  gridContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },

  gridRow: {
    justifyContent: 'space-between',
  },

  card: {
    width: 132,
    marginRight: 12,
  },

  cardFullWidth: {
    width: '48%',
    marginRight: 0,
    marginBottom: 18,
  },

  thumbnailWrap: {
    width: '100%',
    height: 82,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#15151F',
  },

  thumbnailWrapFullWidth: {
    height: 110,
  },

  thumbnail: {
    width: '100%',
    height: '100%',
  },

  playBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  playIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 1,
  },

  statusBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  videoTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 7,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  category: {
    color: '#FF245E',
    fontSize: 8,
    fontWeight: '900',
    maxWidth: 54,
  },

  dot: {
    color: '#777',
    fontSize: 8,
    marginHorizontal: 3,
  },

  meta: {
    color: '#9A9AA3',
    fontSize: 8,
    fontWeight: '600',
    maxWidth: 65,
  },

  emptyText: {
    color: '#777986',
    fontSize: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  // ---- Full-screen player ----
  playerScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  playerVideoArea: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },

  videoPlayer: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },

  playerInfo: {
    padding: 16,
  },

  playerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  playerDescription: {
    color: '#9A9AA3',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    lineHeight: 18,
  },

  playerLoading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});