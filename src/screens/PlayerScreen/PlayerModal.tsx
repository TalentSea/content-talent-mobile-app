import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  Pressable,
  Share,
  View,
  useWindowDimensions,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { Heart, Bookmark, Star, MessageSquare, Share2 } from 'lucide-react-native';

import { NativeVideoPlayer } from '../../components/NativeVideoPlayer';
import { CommentsSection } from '../../components/CommentsSection';
import type { PlayInfo } from '../../../types/video';
import { styles } from '../PlayerScreen/styles';

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
  hasNextVideo = false,
  onToggleAutoplay,
  onVideoEnd,
  onClose,
}: PlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { width, height } = useWindowDimensions();

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

  return (
    <Modal
      visible={!!playingVideo}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.playerScreen}>
        <StatusBar barStyle="light-content" hidden={isFullscreen} />

        <View
          style={
            isFullscreen
              ? { width, height, backgroundColor: '#000000' }
              : styles.playerVideoArea
          }
        >
          {playingVideo ? (
            <NativeVideoPlayer
              uri={playingVideo.stream_url}
              mp4Url={playingVideo.mp4Url}
              downloadUrls={playingVideo.downloadUrls}
              title={playingVideo.title}
              autoStart={true}
              controls={true}
              loop={false}
              muted={false}
              volume={1}
              playbackRate={1}
              resizeMode="contain"
              captions={playingVideo.captions ?? []}
              inbuiltCaptionTracks={playingVideo.inbuiltCaptionTracks ?? []}
              hasInbuiltCaptions={playingVideo.hasInbuiltCaptions ?? false}
              adTagUrl={playingVideo.adTagUrl}
              style={
                isFullscreen
                  ? { width, height, borderRadius: 0 }
                  : styles.videoPlayer
              }
              onToggleFullscreen={toggleFullscreen}
              autoplay={autoplay}
              onToggleAutoplay={onToggleAutoplay}
              onClose={handleClose}
              onEnd={onVideoEnd}
            />
          ) : null}
        </View>

        {!isFullscreen && playingVideo ? (
          <ScrollView
            style={styles.playerInfoScroll}
            contentContainerStyle={styles.playerInfoContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.playerTitle} numberOfLines={2}>
              {playingVideo.title}
            </Text>

            {playingVideo.description ? (
              <Text style={styles.playerDescription}>
                {playingVideo.description}
              </Text>
            ) : null}

            {/* Video Action Buttons Bar: Like | Save | Favourite | Comments | Share */}
            <View style={styles.actionsBar}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => setIsLiked(prev => !prev)}
              >
                <Heart
                  size={18}
                  color={isLiked ? '#EF4444' : '#FFFFFF'}
                  fill={isLiked ? '#EF4444' : 'transparent'}
                />
                <Text style={styles.actionText}>{isLiked ? 'Liked' : 'Like'}</Text>
              </Pressable>

              <Pressable
                style={styles.actionBtn}
                onPress={() => setIsSaved(prev => !prev)}
              >
                <Bookmark
                  size={18}
                  color={isSaved ? '#818CF8' : '#FFFFFF'}
                  fill={isSaved ? '#818CF8' : 'transparent'}
                />
                <Text style={styles.actionText}>{isSaved ? 'Saved' : 'Save'}</Text>
              </Pressable>

              <Pressable
                style={styles.actionBtn}
                onPress={() => setIsFavourited(prev => !prev)}
              >
                <Star
                  size={18}
                  color={isFavourited ? '#F59E0B' : '#FFFFFF'}
                  fill={isFavourited ? '#F59E0B' : 'transparent'}
                />
                <Text style={styles.actionText}>
                  {isFavourited ? 'Favourited' : 'Favourite'}
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

            {/* Render Comments Section ONLY when selected */}
            {showComments ? <CommentsSection /> : null}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}