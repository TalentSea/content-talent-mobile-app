import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  Pressable,
  Share,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Orientation from 'react-native-orientation-locker';
import { Heart, Bookmark, MessageSquare, Share2 } from 'lucide-react-native';
import { NativeVideoPlayer } from '../../components/NativeVideoPlayer';
import { CommentsSection } from '../../components/CommentsSection';
import type { PlayInfo } from '../../../types/video';
import { styles } from '../PlayerScreen/styles';
import { useLibrary } from '../../contexts/LibraryContext';

type PlayerModalProps = {
  playingVideo: PlayInfo | null;
  autoplay?: boolean;
  hasNextVideo?: boolean;
  onToggleAutoplay?: () => void;
  onVideoEnd?: () => void;
  onClose: () => void;
};

export function PlayerModal({
  playingVideo,
  autoplay = false,
  hasNextVideo: _hasNextVideo = false,
  onToggleAutoplay,
  onVideoEnd: _onVideoEnd,
  onClose,
}: PlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [_videoRatio, setVideoRatio] = useState<number | null>(null);
  const { addDownload, hasItem, recordHistory, startDownload, toggleItem } = useLibrary();
  const isLiked = hasItem('liked', playingVideo);
  const isSaved = hasItem('saved', playingVideo);

  useEffect(() => {
    if (playingVideo) recordHistory(playingVideo);
    setVideoRatio(null);
  }, [playingVideo, recordHistory]);

  function handleClose() {
    Orientation.lockToPortrait();
    setShowComments(false);
    onClose();
  }

  function toggleFullscreen() {
    setIsFullscreen(prev => {
      const next = !prev;

      if (next) {
        Orientation.lockToLandscape();
      } else {
        Orientation.lockToPortrait();
      }

      return next;
    });
  }

  async function handleShare() {
    if (!playingVideo?.stream_url) return;
    try {
      await Share.share({
        title: playingVideo.title,
        message: `Watch "${playingVideo.title}" on Streamr: ${playingVideo.stream_url}`,
        url: playingVideo.stream_url,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  }

  const categoryLower = playingVideo?.category?.toLowerCase() || '';
  const titleLower = playingVideo?.title?.toLowerCase() || '';

  // Short videos (like Tokyo vlog in Image 1, Soup Dumplings, category 'shorts', or portrait stream ratio < 0.95)
  const isShortVideo =
    categoryLower === 'shorts' ||
    categoryLower === 'short' ||
    titleLower.includes('soup dumplings') ||
    (_videoRatio != null && _videoRatio < 0.95);

  // 2:3 player for Short videos (Image 1), 16:9 widescreen player for Normal videos (Image 2)
  const activeRatio = isShortVideo ? 2 / 3 : 16 / 9;

  // Full-screen: 'cover' for normal videos (complete full screen), 'contain' for short videos (centered with side black space). Half-screen: 'cover'
  const playerResizeMode = isFullscreen
    ? isShortVideo
      ? 'contain'
      : 'cover'
    : 'cover';

  return (
    <Modal
      visible={!!playingVideo}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={isFullscreen}
    >
      <SafeAreaView style={styles.playerScreen} edges={isFullscreen ? [] : ['top']}>
        <StatusBar barStyle="light-content" hidden={isFullscreen} backgroundColor="#000000" />

        {/* Dynamic Player Frame Box: 2:3 ratio for Shorts (Image 1), 16:9 ratio for Normal videos (Image 2) */}
        <View
          style={
            isFullscreen
              ? styles.fullscreenContainer
              : [
                  styles.playerVideoArea,
                  {
                    width: '100%',
                    aspectRatio: activeRatio,
                  },
                ]
          }
        >
          {playingVideo ? (
            <NativeVideoPlayer
              uri={playingVideo.stream_url}
              mp4Url={playingVideo.mp4Url}
              downloadUrls={playingVideo.downloadUrls}
              title={playingVideo.title}
              category={playingVideo.category}
              autoStart={true}
              controls={true}
              loop={false}
              muted={false}
              volume={1}
              playbackRate={1}
              resizeMode={playerResizeMode}
              captions={playingVideo.captions ?? []}
              inbuiltCaptionTracks={playingVideo.inbuiltCaptionTracks ?? []}
              hasInbuiltCaptions={playingVideo.hasInbuiltCaptions ?? false}
              adTagUrl={playingVideo.adTagUrl}
              style={styles.videoPlayer}
              onToggleFullscreen={toggleFullscreen}
              onLoadRatio={setVideoRatio}
              autoplay={autoplay}
              onToggleAutoplay={onToggleAutoplay}
              onClose={handleClose}
              onDownloadComplete={() => addDownload(playingVideo)}
              onDownloadStart={() => startDownload(playingVideo)}
            />
          ) : null}
        </View>

        {/* Scrollable Video Details & Action Section Below Player Box */}
        {!isFullscreen && playingVideo ? (
          <ScrollView
            style={styles.playerInfoScroll}
            contentContainerStyle={styles.playerInfoContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleHeaderRow}>
              <Text style={styles.playerTitle} numberOfLines={2}>
                {playingVideo.title}
              </Text>
              {playingVideo.category ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    {playingVideo.category}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Description shown for Short videos (Image 1) */}
            {isShortVideo && playingVideo.description ? (
              <Text style={styles.playerDescription}>
                {playingVideo.description}
              </Text>
            ) : null}

            {/* Video Action Buttons Bar */}
            <View style={styles.actionsBar}>
              <Pressable
                style={styles.actionBtn}
                onPress={() =>
                  playingVideo && toggleItem('liked', playingVideo)
                }
              >
                <Heart
                  size={18}
                  color={isLiked ? '#EF4444' : '#FFFFFF'}
                  fill={isLiked ? '#EF4444' : 'transparent'}
                />
                <Text style={styles.actionText}>
                  {isLiked ? 'Liked' : 'Like'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionBtn}
                onPress={() =>
                  playingVideo && toggleItem('saved', playingVideo)
                }
              >
                <Bookmark
                  size={18}
                  color={isSaved ? '#818CF8' : '#FFFFFF'}
                  fill={isSaved ? '#818CF8' : 'transparent'}
                />
                <Text style={styles.actionText}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionBtn}
                onPress={() => setShowComments(prev => !prev)}
              >
                <MessageSquare
                  size={18}
                  color={showComments ? '#10B981' : '#FFFFFF'}
                />
                <Text style={styles.actionText}>Comments</Text>
              </Pressable>

              <Pressable style={styles.actionBtn} onPress={handleShare}>
                <Share2 size={18} color="#FFFFFF" />
                <Text style={styles.actionText}>Share</Text>
              </Pressable>
            </View>

            {showComments ? <CommentsSection /> : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
