import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { Heart, Bookmark, MessageSquare, Share2, Copy, Check, X } from 'lucide-react-native';

import { NativeVideoPlayer } from '../../components/NativeVideoPlayer';
import { CommentsSection } from '../../components/CommentsSection';
import { RelatedContent } from '../../components/RelatedContent/RelatedContent';
import { recordWatchHistory } from '../../services/watchHistory';
import {
  isVideoLiked,
  isVideoSaved,
  toggleLikeVideo,
  toggleSaveVideo,
} from '../../services/userActivity';
import type { ApiVideo, PlayInfo } from '../../types/video';
import type { PlaylistListItem } from '../../services/api/playlistApi';
import { formatViews, getRelativeTimeString } from '../../utils/timeUtils';
import { styles } from '../PlayerScreen/styles';

type PlayerModalProps = {
  playingVideo: PlayInfo | null;
  autoplay?: boolean;
  hasNextVideo?: boolean;
  onToggleAutoplay?: () => void;
  onVideoEnd?: () => void;
  onSelectVideo?: (video: ApiVideo) => void;
  onSelectPlaylist?: (playlist: PlaylistListItem) => void;
  onClose: () => void;
};

export function PlayerModal({
  playingVideo,
  autoplay = false,
  hasNextVideo = false,
  onToggleAutoplay,
  onVideoEnd,
  onSelectVideo,
  onSelectPlaylist,
  onClose,
}: PlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const { width, height } = useWindowDimensions();

  const currentVideoId = (playingVideo as any)?.id || 1;

  const currentVideoObj: ApiVideo = {
    id: currentVideoId,
    title: playingVideo?.title || 'Video',
    description: playingVideo?.description || null,
    main_thumbnail_url: playingVideo?.poster || null,
    category: (playingVideo as any)?.category || 'General',
    tags: (playingVideo as any)?.tags || [],
    status: 'published',
    encode_progress: 100,
    is_playable: true,
    views: (playingVideo as any)?.views ?? 0,
    duration: (playingVideo as any)?.duration || '00:00',
    published_at: (playingVideo as any)?.published_at || new Date().toISOString(),
    scheduled_at: null,
    created_at: (playingVideo as any)?.created_at || new Date().toISOString(),
  };

  useEffect(() => {
    if (playingVideo) {
      recordWatchHistory(currentVideoObj, 45);
      setLiked(isVideoLiked(currentVideoId));
      setSaved(isVideoSaved(currentVideoId));
      setShowFullDescription(false);
      setShowShareModal(false);
      setCopiedLink(false);
    }
  }, [playingVideo, currentVideoId]);

  function handleToggleLike() {
    const next = toggleLikeVideo(currentVideoObj);
    setLiked(next);
  }

  function handleToggleSave() {
    const next = toggleSaveVideo(currentVideoObj);
    setSaved(next);
  }

  function handleClose() {
    try {
      Orientation.lockToPortrait();
    } catch (e) {
      // Safe catch for orientation locker on dev devices
    }
    setShowComments(false);
    setShowShareModal(false);
    onClose();
  }

  function toggleFullscreen() {
    setIsFullscreen(prev => {
      const next = !prev;

      try {
        if (next) {
          Orientation.lockToLandscape();
        } else {
          Orientation.lockToPortrait();
        }
      } catch (e) {
        // Safe catch for orientation locker on dev devices
      }

      return next;
    });
  }

  function handleCopyShareLink() {
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2500);
  }

  const categoryName = (playingVideo as any)?.category || 'General';
  const viewsText = formatViews((playingVideo as any)?.views ?? 0);
  const durationText = (playingVideo as any)?.duration || '00:00';
  const timeAgoText = getRelativeTimeString((playingVideo as any)?.published_at || (playingVideo as any)?.created_at);

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
            {/* 1. Title */}
            <Text style={styles.playerTitle} numberOfLines={2}>
              {playingVideo.title}
            </Text>

            {/* 2. Below Title and Above Description: Category · Views · Duration · Time Uploaded Ago */}
            <View style={styles.playerMetaRow}>
              <View style={styles.playerCategoryBadge}>
                <Text style={styles.playerCategoryBadgeText}>{categoryName}</Text>
              </View>
              <Text style={styles.playerMetaDot}>•</Text>
              <Text style={styles.playerMetaText}>{viewsText}</Text>
              <Text style={styles.playerMetaDot}>•</Text>
              <Text style={styles.playerMetaText}>{durationText}</Text>
              <Text style={styles.playerMetaDot}>•</Text>
              <Text style={styles.playerMetaText}>{timeAgoText}</Text>
            </View>

            {/* 3. Description with "Show More" / "Show Less" */}
            {playingVideo.description ? (
              <View>
                <Text
                  style={styles.playerDescription}
                  numberOfLines={showFullDescription ? undefined : 2}
                >
                  {playingVideo.description}
                </Text>
                {playingVideo.description.length > 80 ? (
                  <Pressable
                    style={styles.showMoreBtn}
                    onPress={() => setShowFullDescription(prev => !prev)}
                  >
                    <Text style={styles.showMoreText}>
                      {showFullDescription ? 'Show Less' : '...Show More'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Clean Video Action Buttons Bar: Like | Save | Comments | Share */}
            <View style={styles.actionsBar}>
              <Pressable
                style={styles.actionBtn}
                onPress={handleToggleLike}
              >
                <Heart
                  size={18}
                  color={liked ? '#EF4444' : '#FFFFFF'}
                  fill={liked ? '#EF4444' : 'transparent'}
                />
                <Text style={styles.actionText}>{liked ? 'Liked' : 'Like'}</Text>
              </Pressable>

              <Pressable
                style={styles.actionBtn}
                onPress={handleToggleSave}
              >
                <Bookmark
                  size={18}
                  color={saved ? '#818CF8' : '#FFFFFF'}
                  fill={saved ? '#818CF8' : 'transparent'}
                />
                <Text style={styles.actionText}>{saved ? 'Saved' : 'Save'}</Text>
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

              <Pressable
                style={styles.actionBtn}
                onPress={() => setShowShareModal(true)}
              >
                <Share2 size={18} color={showShareModal ? '#6366F1' : '#FFFFFF'} />
                <Text style={styles.actionText}>Share</Text>
              </Pressable>
            </View>

            {/* Render Comments Section ONLY when selected */}
            {showComments ? <CommentsSection videoId={currentVideoId} /> : null}

            {/* Related Videos & Playlists Section */}
            <RelatedContent
              currentVideoId={currentVideoId}
              category={(playingVideo as any)?.category}
              onSelectVideo={onSelectVideo}
              onSelectPlaylist={onSelectPlaylist}
            />
          </ScrollView>
        ) : null}

        {/* 100% In-App Share Modal */}
        <Modal
          visible={showShareModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowShareModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
            <View style={{ width: '100%', backgroundColor: '#1E1E2E', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>In-App Share</Text>
                <Pressable onPress={() => setShowShareModal(false)} style={{ padding: 4 }}>
                  <X color="#9CA3AF" size={20} />
                </Pressable>
              </View>

              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>
                Share "{playingVideo?.title}" with other Streamr users:
              </Text>

              {/* Share URL Box */}
              <View style={{ backgroundColor: '#121218', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 }}>
                <Text numberOfLines={1} style={{ fontSize: 12, color: '#E2E8F0', flex: 1, marginRight: 10 }}>
                  {playingVideo?.stream_url || `https://streamr.app/watch/${currentVideoId}`}
                </Text>
                <Pressable
                  onPress={handleCopyShareLink}
                  style={{ backgroundColor: copiedLink ? '#10B981' : '#6366F1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  {copiedLink ? <Check color="#FFFFFF" size={14} /> : <Copy color="#FFFFFF" size={14} />}
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </Text>
                </Pressable>
              </View>

              {/* In-App Share Code */}
              <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#A5B4FC' }}>In-App Share Code:</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#6366F1' }}>#STREAMR-{currentVideoId}</Text>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}