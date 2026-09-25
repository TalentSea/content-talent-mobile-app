import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  Share,
  Text,
  View,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Pause,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import NativeVideoPlayer from '../../components/NativeVideoPlayer/NativeVideoPlayer';
import {
  ShortItem,
  toggleShortLikeApi,
  recordShortShareApi,
} from '../../services/api/shortsApi';
import { ShortsOptionsModal } from './ShortsOptionsModal';
import { styles } from './styles';

type SubtitleCue = {
  start: number;
  end: number;
  text: string;
};

function parseVTTOrSRT(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  if (!content) return cues;
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let i = 0;

  function parseTime(timeStr: string): number {
    const parts = timeStr.trim().replace(',', '.').split(':');
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 0;
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->');
      const start = parseTime(startStr);
      const end = parseTime(endStr);
      i++;
      let text = '';
      while (i < lines.length && lines[i].trim() !== '') {
        text += (text ? '\n' : '') + lines[i].trim();
        i++;
      }
      if (text && end > start) {
        const cleanText = text.replace(/<[^>]*>/g, '');
        cues.push({ start, end, text: cleanText });
      }
    }
    i++;
  }
  return cues;
}

function generateAutoCues(title: string, desc?: string | null, totalDuration: number = 30): SubtitleCue[] {
  const text = [title, desc].filter(Boolean).join(' • ').trim();
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // Group into readable subtitle phrases (3 to 5 words)
  const chunkSize = Math.max(3, Math.min(5, Math.ceil(words.length / 4)));
  const cues: SubtitleCue[] = [];
  const cueDuration = 2.8; // 2.8s per phrase, ideal for reels/shorts readability
  let curTime = 0.0;

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkText = words.slice(i, i + chunkSize).join(' ');
    cues.push({
      start: curTime,
      end: curTime + cueDuration,
      text: chunkText,
    });
    curTime += cueDuration;
  }
  return cues;
}

type ShortCardProps = {
  item: ShortItem;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenComments?: (shortId: number) => void;
  onLikeToggle?: (shortId: number, isLiked: boolean, likesCount: number) => void;
};

export function ShortCard({
  item,
  isActive,
  isMuted,
  onToggleMute,
  onOpenComments,
  onLikeToggle,
}: ShortCardProps) {
  const [userPaused, setUserPaused] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(item.commentsCount || 0);

  // Playback & Timing State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.duration || 30);

  // Captions & Options Modal State
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('en-auto');
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);

  // Double-tap heart burst animation
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<any>(null);

  useEffect(() => {
    setIsLiked(item.isLiked || false);
    setLikesCount(item.likesCount || 0);
    setCommentsCount(item.commentsCount || 0);
  }, [item.id, item.isLiked, item.likesCount, item.commentsCount]);

  useEffect(() => {
    // Reset pause state when active index changes
    if (!isActive) {
      setUserPaused(false);
      setShowBadge(false);
      setShowHeartBurst(false);
    }
  }, [isActive]);

  // Load / Generate Subtitle Cues
  useEffect(() => {
    let isMounted = true;

    // Check if the selected track corresponds to an external caption URL
    const trackItem = (item.captions || []).find(
      c => (c.srclang || '') === selectedTrack || (c.language || '') === selectedTrack
    );

    if (trackItem && trackItem.url) {
      fetch(trackItem.url)
        .then(res => res.text())
        .then(text => {
          if (isMounted) {
            const parsed = parseVTTOrSRT(text);
            setSubtitleCues(parsed.length > 0 ? parsed : generateAutoCues(item.title, item.description, duration));
          }
        })
        .catch(err => {
          console.warn('[ShortCard] Notice fetching VTT caption:', err);
          if (isMounted) {
            setSubtitleCues(generateAutoCues(item.title, item.description, duration));
          }
        });
    } else {
      // Auto-generated cues from title & description
      setSubtitleCues(generateAutoCues(item.title, item.description, duration));
    }

    return () => {
      isMounted = false;
    };
  }, [item.id, item.title, item.description, item.captions, selectedTrack, duration]);

  const triggerHeartBurst = () => {
    setShowHeartBurst(true);
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.2,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowHeartBurst(false);
    });
  };

  const handleDoubleTap = async () => {
    triggerHeartBurst();
    if (!isLiked) {
      const nextLiked = true;
      const nextCount = likesCount + 1;
      setIsLiked(nextLiked);
      setLikesCount(nextCount);
      onLikeToggle?.(item.id, nextLiked, nextCount);

      const res = await toggleShortLikeApi(item.id);
      if (res) {
        setIsLiked(res.is_liked);
        if (typeof res.likes_count === 'number') {
          setLikesCount(res.likes_count);
          onLikeToggle?.(item.id, res.is_liked, res.likes_count);
        }
      }
    }
  };

  const handleSingleTap = () => {
    setUserPaused(prev => !prev);
    setShowBadge(true);
    setTimeout(() => {
      setShowBadge(false);
    }, 800);
  };

  const handleSurfacePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      handleDoubleTap();
    } else {
      lastTapRef.current = now;
      singleTapTimerRef.current = setTimeout(() => {
        handleSingleTap();
        singleTapTimerRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleToggleLike = async () => {
    const nextState = !isLiked;
    const nextCount = nextState ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextState);
    setLikesCount(nextCount);
    onLikeToggle?.(item.id, nextState, nextCount);

    if (nextState) {
      triggerHeartBurst();
    }

    const res = await toggleShortLikeApi(item.id);
    if (res) {
      setIsLiked(res.is_liked);
      if (typeof res.likes_count === 'number') {
        setLikesCount(res.likes_count);
        onLikeToggle?.(item.id, res.is_liked, res.likes_count);
      }
    }
  };

  const handleShare = async () => {
    try {
      recordShortShareApi(item.id).catch(() => {});
      const shareUrl = item.streamUrl || `streamr://shorts/${item.id}`;
      await Share.share({
        title: item.title || 'Check out this Short',
        message: `Watch "${item.title || 'Short'}" on Streamr!\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      console.warn('[ShortCard] Share notice:', e);
    }
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
  };

  // Keep currentTime moving smoothly even if ExoPlayer progress event throttles or duration is unset
  useEffect(() => {
    if (!isActive || userPaused) return;
    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.25;
        const max = duration > 0 ? duration : 30;
        return next >= max ? 0 : next;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [isActive, userPaused, duration]);

  // Find active subtitle cue based on playback currentTime (cycles seamlessly with video)
  const activeCue = React.useMemo(() => {
    if (!captionsEnabled || subtitleCues.length === 0) return null;
    const lastCue = subtitleCues[subtitleCues.length - 1];
    const totalCueTime = lastCue ? lastCue.end : 0;
    const timeInCycle = totalCueTime > 0 ? currentTime % totalCueTime : currentTime;
    const match = subtitleCues.find(c => timeInCycle >= c.start && timeInCycle < c.end);
    return match ? match.text : subtitleCues[0]?.text || null;
  }, [captionsEnabled, subtitleCues, currentTime]);

  return (
    <View style={styles.shortCard}>
      {/* Video Player */}
      <NativeVideoPlayer
        uri={item.streamUrl}
        autoStart={isActive && !userPaused}
        controls={false}
        loop={true}
        muted={isMuted}
        resizeMode="cover"
        style={styles.playerStyle}
        onProgress={(cur, dur) => {
          if (typeof cur === 'number' && !isNaN(cur)) {
            setCurrentTime(cur);
          }
          if (typeof dur === 'number' && dur > 0) {
            setDuration(dur);
          }
        }}
      />

      {/* Tap Overlay (Handles single tap for Play/Pause and double tap for Like) */}
      <Pressable style={styles.touchableOverlay} onPress={handleSurfacePress}>
        {showBadge && (
          <View style={styles.playPauseBadge}>
            {userPaused ? (
              <Play size={36} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Pause size={36} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </View>
        )}

        {/* Double-tap animated heart pop */}
        {showHeartBurst && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              transform: [{ scale: heartScale }],
              opacity: heartOpacity,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={96} color="#EF4444" fill="#EF4444" />
          </Animated.View>
        )}
      </Pressable>

      {/* Subtitle Cue Overlay (when Captions are ON) */}
      {captionsEnabled && activeCue ? (
        <View style={styles.shortsSubtitleOverlay} pointerEvents="none">
          <View style={styles.shortsSubtitleBox}>
            <Text style={styles.shortsSubtitleText}>
              {activeCue}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Right Sidebar Action Icons */}
      <View style={styles.rightSidebar}>
        {/* Like Button */}
        <Pressable style={styles.actionButton} onPress={handleToggleLike}>
          <View style={styles.iconCircle}>
            <Heart
              size={24}
              color={isLiked ? '#EF4444' : '#FFFFFF'}
              fill={isLiked ? '#EF4444' : 'transparent'}
            />
          </View>
          <Text style={styles.actionText}>{formatCount(likesCount)}</Text>
        </Pressable>

        {/* Comments Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => onOpenComments?.(item.id)}
        >
          <View style={styles.iconCircle}>
            <MessageCircle size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.actionText}>{formatCount(commentsCount)}</Text>
        </Pressable>

        {/* Share Button */}
        <Pressable style={styles.actionButton} onPress={handleShare}>
          <View style={styles.iconCircle}>
            <Share2 size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.actionText}>Share</Text>
        </Pressable>

        {/* Mute / Unmute Toggle Button */}
        <Pressable style={styles.actionButton} onPress={onToggleMute}>
          <View style={styles.iconCircle}>
            {isMuted ? (
              <VolumeX size={24} color="#EF4444" />
            ) : (
              <Volume2 size={24} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.actionText}>{isMuted ? 'Muted' : 'Sound'}</Text>
        </Pressable>

        {/* More Options (...) & Caption Settings Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => setShowOptionsModal(true)}
        >
          <View
            style={[
              styles.iconCircle,
              captionsEnabled && {
                borderColor: '#818CF8',
                backgroundColor: 'rgba(99, 102, 241, 0.25)',
              },
            ]}
          >
            <MoreHorizontal
              size={24}
              color={captionsEnabled ? '#818CF8' : '#FFFFFF'}
            />
          </View>
          <Text
            style={[
              styles.actionText,
              captionsEnabled && { color: '#818CF8', fontWeight: '800' },
            ]}
          >
            {captionsEnabled ? 'CC On' : 'More'}
          </Text>
        </Pressable>
      </View>

      {/* Bottom Info Overlay (without @username) */}
      <View style={styles.bottomInfoContainer}>
        <Text style={styles.shortTitleText} numberOfLines={2}>
          {item.title} {item.description ? `• ${item.description}` : ''}
        </Text>
      </View>

      {/* Shorts Options & Captions Settings Modal */}
      <ShortsOptionsModal
        visible={showOptionsModal}
        short={item}
        captionsEnabled={captionsEnabled}
        onToggleCaptions={setCaptionsEnabled}
        selectedTrack={selectedTrack}
        onSelectTrack={setSelectedTrack}
        onClose={() => setShowOptionsModal(false)}
      />
    </View>
  );
}

