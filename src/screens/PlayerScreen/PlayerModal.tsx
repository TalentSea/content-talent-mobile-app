import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  Text,
  Pressable,
  View,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Orientation from 'react-native-orientation-locker';
import { Heart, Bookmark, MessageSquare, Share2, Copy, Check, X, Sparkles, Lock } from 'lucide-react-native';

import { NativeVideoPlayer } from '../../components/NativeVideoPlayer';
import { CommentsSection } from '../../components/CommentsSection';
import { RelatedContent } from '../../components/RelatedContent/RelatedContent';
import { isUserSubscribed, subscribeAuthChange } from '../../services/api/authService';
import { recordWatchHistory } from '../../services/watchHistory';
import {
  getCleanLikesCountForVideo,
  isVideoLiked,
  isVideoSaved,
  subscribeUserActivity,
  toggleLikeVideo,
  toggleSaveVideo,
} from '../../services/userActivity';
import { incrementVideoViewsApi } from '../../services/api/userActivityApi';
import {
  getCleanViewCountForVideo,
  hasUserViewedVideo,
  initViewTracker,
  markVideoAsViewed,
  subscribeViewTracker,
} from '../../services/viewTracker';
import type { ApiVideo, PlayInfo } from '../../types/video';
import type { PlaylistListItem } from '../../services/api/playlistApi';
import { formatLikes, formatViews, getRelativeTimeString } from '../../utils/timeUtils';
import { styles } from '../PlayerScreen/styles';

type PlayerModalProps = {
  playingVideo: PlayInfo | null;
  autoplay?: boolean;
  hasNextVideo?: boolean;
  onToggleAutoplay?: () => void;
  onVideoEnd?: () => void;
  onSelectVideo?: (video: ApiVideo) => void;
  onSelectPlaylist?: (playlist: PlaylistListItem) => void;
  onUpgradeSubscription?: () => void;
  onClose: () => void;
};

export function PlayerModal({
  playingVideo,
  autoplay = true,
  hasNextVideo = false,
  onToggleAutoplay,
  onVideoEnd,
  onSelectVideo,
  onSelectPlaylist,
  onUpgradeSubscription,
  onClose,
}: PlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [likesCount, setLikesCount] = useState<number>(0);
  const hasCountedViewRef = useRef(false);
  const [videoRatio, setVideoRatio] = useState<number | null>(null);
  const { width, height } = useWindowDimensions();
  const [isSubscribed, setIsSubscribed] = useState(isUserSubscribed());

  useEffect(() => {
    setIsSubscribed(isUserSubscribed());
    const unsubscribe = subscribeAuthChange(() => {
      setIsSubscribed(isUserSubscribed());
    });
    return unsubscribe;
  }, []);

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
    views: viewsCount,
    likes: likesCount,
    duration: (playingVideo as any)?.duration || '00:00',
    published_at: (playingVideo as any)?.published_at || new Date().toISOString(),
    scheduled_at: null,
    created_at: (playingVideo as any)?.created_at || new Date().toISOString(),
  };

  // Hardware Back Handler for Android Phone Back Button
  useEffect(() => {
    if (!playingVideo) return;

    const onHardwareBackPress = () => {
      if (isFullscreen) {
        setIsFullscreen(false);
        try {
          Orientation.lockToPortrait();
        } catch (e) {
          // Safe catch
        }
        return true;
      } else {
        handleClose();
        return true;
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => {
      subscription.remove();
    };
  }, [playingVideo, isFullscreen]);

  useEffect(() => {
    if (playingVideo) {
      initViewTracker();
      hasCountedViewRef.current = false;
      const initialViews = getCleanViewCountForVideo(currentVideoId);
      const initialLikes = getCleanLikesCountForVideo(currentVideoId);
      setViewsCount(initialViews);
      setLikesCount(initialLikes);

      setLiked(isVideoLiked(currentVideoId));
      setSaved(isVideoSaved(currentVideoId));
      setShowFullDescription(false);
      setShowShareModal(false);
      setCopiedLink(false);
      setVideoRatio(null);
    }
  }, [playingVideo, currentVideoId]);

  useEffect(() => {
    if (!playingVideo) return;

    const unsubView = subscribeViewTracker(() => {
      setViewsCount(getCleanViewCountForVideo(currentVideoId));
    });

    const unsubActivity = subscribeUserActivity(() => {
      setLikesCount(getCleanLikesCountForVideo(currentVideoId));
      setLiked(isVideoLiked(currentVideoId));
    });

    return () => {
      unsubView();
      unsubActivity();
    };
  }, [playingVideo, currentVideoId]);

function parseDurationInSeconds(durationVal?: string | number | null): number {
  if (typeof durationVal === 'number' && !isNaN(durationVal) && durationVal > 0) {
    return durationVal;
  }
  if (typeof durationVal === 'string' && durationVal.trim().length > 0) {
    const parts = durationVal.trim().split(':').map(p => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    const parsedNum = parseFloat(durationVal);
    if (!isNaN(parsedNum) && parsedNum > 0) return parsedNum;
  }
  return 0;
}

  function handlePlayerProgress(currentTime: number, duration?: number) {
    const effectiveDuration = (typeof duration === 'number' && duration > 0)
      ? duration
      : parseDurationInSeconds((playingVideo as any)?.duration);

    const progressPercentage = effectiveDuration > 0
      ? Math.round((currentTime / effectiveDuration) * 100)
      : 0;

    // Record user-specific watch progress dynamically as the user watches
    if (currentTime > 2) {
      recordWatchHistory(currentVideoObj, progressPercentage, Math.floor(currentTime));
    }

    if (!hasCountedViewRef.current) {
      const requiredWatchTime = (effectiveDuration > 0 && effectiveDuration < 30)
        ? (effectiveDuration * 0.5)
        : 30;

      if (currentTime >= requiredWatchTime) {
        hasCountedViewRef.current = true;
        markVideoAsViewed(currentVideoId);
        setViewsCount(getCleanViewCountForVideo(currentVideoId));
      }
    }
  }

  function handleToggleLike() {
    const nextLikedState = toggleLikeVideo(currentVideoObj);
    setLiked(nextLikedState);
    setLikesCount(getCleanLikesCountForVideo(currentVideoId));
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

  async function handleCopyShareLink() {
    setCopiedLink(true);
    try {
      const shareUrl = `streamr://watch/${currentVideoId}`;
      await Share.share({
        title: playingVideo?.title || 'Share Video',
        message: `Watch "${playingVideo?.title || 'Video'}" in Streamr App: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (err) {
      console.warn('[PlayerModal] Notice sharing video link:', err);
    } finally {
      setTimeout(() => {
        setCopiedLink(false);
      }, 2500);
    }
  }

  const categoryName = (playingVideo as any)?.category || 'General';
  const viewsText = formatViews(viewsCount);
  const likesText = formatLikes(likesCount);
  const timeAgoText = getRelativeTimeString((playingVideo as any)?.published_at || (playingVideo as any)?.created_at);

  const categoryLower = categoryName.toLowerCase();
  const titleLower = (playingVideo?.title || '').toLowerCase();

  // Determine if this is a vertical/short video:
  // Checked by category ('shorts'/'short'), title ('soup dumplings'), or native video aspect ratio (< 0.95)
  const isShortVideo =
    categoryLower === 'shorts' ||
    categoryLower === 'short' ||
    titleLower.includes('soup dumplings') ||
    (videoRatio != null && videoRatio < 0.95);

  // 2:3 player frame for Short videos (Image 1), 16:9 widescreen player frame for Normal videos (Image 2)
  const activeRatio = isShortVideo ? 2 / 3 : 16 / 9;

  // Full-screen: 'contain' for short videos (Image 3 with side black pillarboxes), 'cover' for normal videos (Image 4)
  // Half-screen: 'cover' fills the chosen 2:3 or 16:9 box cleanly
  const playerResizeMode = isFullscreen ? (isShortVideo ? 'contain' : 'cover') : 'cover';

  return (
    <Modal
      visible={!!playingVideo}
      animationType="slide"
      onRequestClose={() => {
        if (isFullscreen) {
          setIsFullscreen(false);
          try {
            Orientation.lockToPortrait();
          } catch (e) {
            // Safe catch
          }
        } else {
          handleClose();
        }
      }}
      statusBarTranslucent={isFullscreen}
    >
      <SafeAreaView style={styles.playerScreen} edges={isFullscreen ? [] : ['top', 'bottom']}>
        <StatusBar barStyle="light-content" hidden={isFullscreen} backgroundColor="#000000" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >

        {/* Dynamic Player Frame Box */}
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
          {playingVideo && isSubscribed ? (
            <NativeVideoPlayer
              video={currentVideoObj}
              id={currentVideoId}
              category={categoryName}
              thumbnailUrl={playingVideo.poster}
              description={playingVideo.description}
              uri={playingVideo.stream_url || playingVideo.playback_url || ''}
              mp4Url={playingVideo.mp4Url}
              downloadUrls={playingVideo.downloadUrls}
              title={playingVideo.title}
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
              onEnd={onVideoEnd}
              onProgress={handlePlayerProgress}
            />
          ) : playingVideo ? (
            <View style={{ flex: 1, backgroundColor: '#0A0A10', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Lock size={44} color="#6366F1" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16, textAlign: 'center', marginBottom: 6 }}>
                VIP Subscription Required
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
                Subscribe to unlock ad-free 4K video playback.
              </Text>
              <Pressable
                style={{ backgroundColor: '#6366F1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
                onPress={() => {
                  handleClose();
                  if (onUpgradeSubscription) onUpgradeSubscription();
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                  Subscribe Now
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {!isFullscreen && playingVideo ? (
          <ScrollView
            style={styles.playerInfoScroll}
            contentContainerStyle={styles.playerInfoContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {/* 1. Title */}
            <Text style={styles.playerTitle} numberOfLines={2}>
              {playingVideo.title}
            </Text>

            {/* 2. Below Title and Above Description: Category · Views · Time Uploaded Ago */}
            <View style={styles.playerMetaRow}>
              <View style={styles.playerCategoryBadge}>
                <Text style={styles.playerCategoryBadgeText}>{categoryName}</Text>
              </View>
              <Text style={styles.playerMetaDot}>•</Text>
              <Text style={styles.playerMetaText}>{viewsText}</Text>
              <Text style={styles.playerMetaDot}>•</Text>
              <Text style={styles.playerMetaText}>{timeAgoText}</Text>
            </View>

            {/* 3. Description with "Show More" / "Show Less" */}
            {playingVideo.description &&
            !playingVideo.description.trim().startsWith('pkill') &&
            !playingVideo.description.includes('uvicorn') &&
            !playingVideo.description.includes('nohup') ? (
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
                <Text style={[styles.actionText, liked ? { color: '#EF4444', fontWeight: '700' } : null]}>
                  {likesText}
                </Text>
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

            {/* VIP Upgrade Subscription Banner when Video is Selected */}
            <View style={{
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              borderColor: '#6366F1',
              borderWidth: 1.5,
              borderRadius: 14,
              padding: 12,
              marginTop: 12,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#6366F1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sparkles size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                    Upgrade to VIP Access
                  </Text>
                  <Text style={{ color: '#A5B4FC', fontSize: 11, marginTop: 1 }}>
                    Ad-Free 4K Ultra HD • ₹99/mo via Razorpay UPI
                  </Text>
                </View>
              </View>

              {onUpgradeSubscription ? (
                <Pressable
                  style={({ pressed }) => [{
                    backgroundColor: '#6366F1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    opacity: pressed ? 0.8 : 1,
                  }]}
                  onPress={onUpgradeSubscription}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                    Upgrade
                  </Text>
                </Pressable>
              ) : null}
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
                  {`streamr://watch/${currentVideoId}`}
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

              {/* In-App Deep Link Code */}
              <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#A5B4FC' }}>In-App Deep Link Code:</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#6366F1' }}>#STREAMR-{currentVideoId}</Text>
              </View>
            </View>
          </View>
        </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}