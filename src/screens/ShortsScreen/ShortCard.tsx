import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Pause,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import NativeVideoPlayer, { NativeVideoPlayerRef } from '../../components/NativeVideoPlayer/NativeVideoPlayer';
import {
  ShortItem,
  toggleShortLikeApi,
  toggleShortSaveApi,
  recordShortShareApi,
} from '../../services/api/shortsApi';
import { isShortSaved, toggleSaveShort } from '../../services/userActivity';
import { triggerHaptic } from '../../utils/haptics';
import { ShortsOptionsModal } from './ShortsOptionsModal';
import { styles } from './styles';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

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

  const chunkSize = Math.max(3, Math.min(5, Math.ceil(words.length / 4)));
  const cues: SubtitleCue[] = [];
  const cueDuration = 2.8;
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

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

type ShortCardProps = {
  item: ShortItem;
  isActive: boolean;
  shouldPreload?: boolean;
  isPlaybackAllowed?: boolean;
  isMuted: boolean;
  cardHeight?: number;
  onToggleMute: () => void;
  onOpenComments?: (shortId: number) => void;
  onLikeToggle?: (shortId: number, isLiked: boolean, likesCount: number) => void;
};

export function ShortCard({
  item,
  isActive,
  shouldPreload = false,
  isPlaybackAllowed = true,
  isMuted,
  cardHeight,
  onToggleMute,
  onOpenComments,
  onLikeToggle,
}: ShortCardProps) {
  const playerRef = useRef<NativeVideoPlayerRef>(null);

  const shouldMountPlayer = isActive || shouldPreload;

  const [userPaused, setUserPaused] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likesCount, setLikesCount] = useState(item.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(item.commentsCount || 0);
  const [isSaved, setIsSaved] = useState(() => isShortSaved(item.id) || !!item.isSaved);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Hold to Speed Up (2X Playback Rate like YouTube/TikTok)
  const [isSpeedingUp, setIsSpeedingUp] = useState(false);

  // Playback & Timing State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.duration || 30);

  // Scrubber progress bar seeking state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTargetTime, setScrubTargetTime] = useState<number | null>(null);

  // Description expand/collapse state (...more)
  const [isDescExpanded, setIsDescExpanded] = useState(false);

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

  // Retention Milestones & Loop Telemetry Tracking
  const milestonesFiredRef = useRef<Set<number>>(new Set());
  const loopsCompletedRef = useRef<number>(0);

  useEffect(() => {
    setIsLiked(item.isLiked || false);
    setLikesCount(item.likesCount || 0);
    setCommentsCount(item.commentsCount || 0);
    setIsSaved(isShortSaved(item.id) || !!item.isSaved);
  }, [item.id, item.isLiked, item.likesCount, item.commentsCount, item.isSaved]);

  useEffect(() => {
    if (!isActive) {
      setUserPaused(false);
      setShowBadge(false);
      setShowHeartBurst(false);
      setIsSpeedingUp(false);
      setIsScrubbing(false);
      setIsDescExpanded(false);
      milestonesFiredRef.current.clear();
      loopsCompletedRef.current = 0;
    }
  }, [isActive]);

  // Load Subtitle Cues
  useEffect(() => {
    let isMounted = true;
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
        .catch(() => {
          if (isMounted) {
            setSubtitleCues(generateAutoCues(item.title, item.description, duration));
          }
        });
    } else {
      setSubtitleCues(generateAutoCues(item.title, item.description, duration));
    }

    return () => {
      isMounted = false;
    };
  }, [item.id, item.title, item.description, item.captions, selectedTrack, duration]);

  // Retention Telemetry Milestones (25%, 50%, 75%, 100%, and loop count)
  useEffect(() => {
    if (!isActive || duration <= 0) return;
    const progressPercent = Math.floor((currentTime / duration) * 100);

    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
      if (progressPercent >= m && !milestonesFiredRef.current.has(m)) {
        milestonesFiredRef.current.add(m);
      }
    }

    // Check video loop restart
    if (currentTime >= duration - 0.6 && !milestonesFiredRef.current.has(100)) {
      milestonesFiredRef.current.add(100);
      loopsCompletedRef.current += 1;
    } else if (currentTime < 1.0 && milestonesFiredRef.current.has(100)) {
      // Loop restarted smoothly
      milestonesFiredRef.current.clear();
    }
  }, [isActive, currentTime, duration, item.id]);

  // PanResponder for Interactive Bottom Scrubber
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsScrubbing(true);
        triggerHaptic('selection');
        const touchX = evt.nativeEvent.pageX;
        const targetRatio = Math.max(0, Math.min(1, touchX / WINDOW_WIDTH));
        const targetSec = targetRatio * (duration > 0 ? duration : 30);
        setScrubTargetTime(targetSec);
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.pageX;
        const targetRatio = Math.max(0, Math.min(1, touchX / WINDOW_WIDTH));
        const targetSec = targetRatio * (duration > 0 ? duration : 30);
        setScrubTargetTime(targetSec);
      },
      onPanResponderRelease: () => {
        if (scrubTargetTime !== null) {
          playerRef.current?.seekTo(scrubTargetTime);
          setCurrentTime(scrubTargetTime);
          triggerHaptic('light');
        }
        setIsScrubbing(false);
        setScrubTargetTime(null);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
        setScrubTargetTime(null);
      },
    })
  ).current;

  const triggerHeartBurst = () => {
    setShowHeartBurst(true);
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.25,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 850,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowHeartBurst(false);
    });
  };

  const handleDoubleTap = async () => {
    triggerHeartBurst();
    triggerHaptic('medium');
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
    }, 700);
  };

  const handleSurfacePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;

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
    triggerHaptic('medium');
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

  const handleToggleSave = () => {
    triggerHaptic('light');
    const nextSaved = toggleSaveShort(item);
    setIsSaved(nextSaved);
    setSaveToast(nextSaved ? 'Saved to your list' : 'Removed from saved');
    setTimeout(() => {
      setSaveToast(null);
    }, 1500);

    toggleShortSaveApi(item.id).catch(err =>
      console.warn('[ShortCard] API save notice:', err)
    );
  };

  const handleToggleSound = () => {
    triggerHaptic('light');
    onToggleMute();
  };

  const handleShare = async () => {
    triggerHaptic('light');
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

  // Continuous timer ticker to keep UI moving smoothly
  useEffect(() => {
    if (!isActive || userPaused || !isPlaybackAllowed || isScrubbing) return;
    const rate = isSpeedingUp ? 2.0 : 1.0;
    const intervalMs = isSpeedingUp ? 125 : 250;

    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.25 * rate;
        const max = duration > 0 ? duration : 30;
        return next >= max ? 0 : next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isActive, userPaused, isPlaybackAllowed, isScrubbing, isSpeedingUp, duration]);

  // Find active subtitle cue for Dynamic Highlight / Karaoke Subtitles
  const activeCueObj = useMemo(() => {
    if (!captionsEnabled || subtitleCues.length === 0) return null;
    const lastCue = subtitleCues[subtitleCues.length - 1];
    const totalCueTime = lastCue ? lastCue.end : 0;
    const timeInCycle = totalCueTime > 0 ? currentTime % totalCueTime : currentTime;
    const match = subtitleCues.find(c => timeInCycle >= c.start && timeInCycle < c.end);
    return match || subtitleCues[0] || null;
  }, [captionsEnabled, subtitleCues, currentTime]);

  const activeProgressSec = isScrubbing && scrubTargetTime !== null ? scrubTargetTime : currentTime;
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, activeProgressSec / duration)) : 0;

  return (
    <View style={[styles.shortCard, cardHeight ? { height: cardHeight } : null]}>
      {/* Underlying Poster Thumbnail to prevent black flash during swipe/buffering */}
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          resizeMode="cover"
        />
      ) : null}

      {/* Video Player: Mounted for active and preloaded adjacent items */}
      {shouldMountPlayer ? (
        <NativeVideoPlayer
          ref={playerRef}
          uri={item.streamUrl}
          thumbnailUrl={item.thumbnailUrl || undefined}
          autoStart={isActive && isPlaybackAllowed && !userPaused}
          controls={false}
          loop={true}
          muted={isActive ? isMuted : true}
          playbackRate={isSpeedingUp ? 2.0 : 1.0}
          resizeMode="cover"
          style={StyleSheet.flatten([styles.playerStyle, cardHeight ? { height: cardHeight } : null])}
          onProgress={(cur, dur) => {
            if (!isScrubbing && typeof cur === 'number' && !isNaN(cur)) {
              setCurrentTime(cur);
            }
            if (typeof dur === 'number' && dur > 0) {
              setDuration(dur);
            }
          }}
        />
      ) : null}

      {/* Tap Overlay (single tap = pause/play, double tap = like, hold = 2X speed) */}
      <Pressable
        style={styles.touchableOverlay}
        onPress={handleSurfacePress}
        onLongPress={() => {
          setIsSpeedingUp(true);
          triggerHaptic('medium');
        }}
        onPressOut={() => {
          if (isSpeedingUp) {
            setIsSpeedingUp(false);
          }
        }}
        delayLongPress={350}
      >
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

      {/* 2X Speed Floating Indicator (when holding down screen) */}
      {isSpeedingUp && (
        <View style={styles.speedPillIndicator} pointerEvents="none">
          <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
          <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: -5 }} />
          <Text style={styles.speedPillText}>2X Speed</Text>
        </View>
      )}

      {/* Dynamic Highlight / Karaoke Subtitles Overlay (Auto-adjusted higher when description expanded) */}
      {captionsEnabled && activeCueObj ? (
        <View
          style={[
            styles.shortsSubtitleOverlay,
            { bottom: isDescExpanded ? 180 : 90 },
          ]}
          pointerEvents="none"
        >
          <View style={styles.shortsSubtitleBox}>
            <Text style={styles.shortsSubtitleText}>
              {(() => {
                const words = activeCueObj.text.split(/\s+/).filter(Boolean);
                const cueDur = Math.max(0.1, activeCueObj.end - activeCueObj.start);
                const cycleTime = subtitleCues[subtitleCues.length - 1]?.end
                  ? currentTime % subtitleCues[subtitleCues.length - 1].end
                  : currentTime;
                const elapsedInCue = Math.max(0, cycleTime - activeCueObj.start);
                const progressRatioCue = Math.min(1, elapsedInCue / cueDur);
                const currentWordIdx = Math.floor(progressRatioCue * words.length);

                return words.map((word, wIdx) => {
                  const isSpoken = wIdx <= currentWordIdx;
                  return (
                    <Text
                      key={wIdx}
                      style={{
                        color: isSpoken ? '#FACC15' : '#E2E8F0',
                        fontWeight: isSpoken ? '900' : '600',
                      }}
                    >
                      {word}{' '}
                    </Text>
                  );
                });
              })()}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Right Sidebar Action Icons (matching YouTube Shorts / Image 2 with transparent background) */}
      <View style={styles.rightSidebar}>
        {/* Like Button */}
        <Pressable style={styles.actionButton} onPress={handleToggleLike}>
          <View style={styles.actionIconContainer}>
            <Heart
              size={28}
              color={isLiked ? '#EF4444' : '#FFFFFF'}
              fill={isLiked ? '#EF4444' : 'transparent'}
            />
          </View>
          <Text style={styles.actionText}>{formatCount(likesCount)}</Text>
        </Pressable>

        {/* Comments Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            triggerHaptic('light');
            onOpenComments?.(item.id);
          }}
        >
          <View style={styles.actionIconContainer}>
            <MessageCircle size={28} color="#FFFFFF" fill="transparent" />
          </View>
          <Text style={styles.actionText}>{formatCount(commentsCount)}</Text>
        </Pressable>

        {/* Save Button */}
        <Pressable style={styles.actionButton} onPress={handleToggleSave}>
          <View style={styles.actionIconContainer}>
            <Bookmark
              size={28}
              color={isSaved ? '#38BDF8' : '#FFFFFF'}
              fill={isSaved ? '#38BDF8' : 'transparent'}
            />
          </View>
          <Text
            style={[
              styles.actionText,
              isSaved && { color: '#38BDF8', fontWeight: '800' },
            ]}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </Pressable>

        {/* Share Button */}
        <Pressable style={styles.actionButton} onPress={handleShare}>
          <View style={styles.actionIconContainer}>
            <Share2 size={28} color="#FFFFFF" fill="transparent" />
          </View>
          <Text style={styles.actionText}>Share</Text>
        </Pressable>

        {/* Mute / Unmute Toggle Button */}
        <Pressable style={styles.actionButton} onPress={handleToggleSound}>
          <View style={styles.actionIconContainer}>
            {isMuted ? (
              <VolumeX size={28} color="#EF4444" />
            ) : (
              <Volume2 size={28} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.actionText}>{isMuted ? 'Muted' : 'Sound'}</Text>
        </Pressable>

        {/* More Options (...) & Caption Settings Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            triggerHaptic('light');
            setShowOptionsModal(true);
          }}
        >
          <View style={styles.actionIconContainer}>
            <MoreHorizontal
              size={28}
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

      {/* Save Action Overlay Banner Toast */}
      {saveToast && (
        <View
          style={{
            position: 'absolute',
            top: 70,
            alignSelf: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: 'rgba(59, 130, 246, 0.4)',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
            zIndex: 99,
          }}
          pointerEvents="none"
        >
          <Bookmark size={16} color="#38BDF8" fill={isSaved ? '#38BDF8' : 'transparent'} />
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
            {saveToast}
          </Text>
        </View>
      )}

      {/* Bottom Info Overlay (without username or avatar, positioned like in Image 2) */}
      <View style={styles.bottomInfoContainer}>
        <View>
          <Text
            style={styles.shortTitleText}
            numberOfLines={isDescExpanded ? undefined : 2}
          >
            <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>{item.title}</Text>
            {item.description ? (
              <Text style={{ fontWeight: '400', color: '#E2E8F0' }}>
                {' '}• {item.description}
              </Text>
            ) : null}
          </Text>

          {/* Expandable Description Toggle: ...more / less */}
          {(item.description || (item.title && item.title.length > 50)) && (
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setIsDescExpanded(prev => !prev);
              }}
              hitSlop={8}
              style={{ alignSelf: 'flex-start', marginTop: 2, marginBottom: 2 }}
            >
              <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '800' }}>
                {isDescExpanded ? 'less' : '...more'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Interactive Scrubber Progress Bar at the Bottom of Card */}
      <View style={styles.scrubberContainer} {...panResponder.panHandlers}>
        <View style={[styles.scrubberTrack, isScrubbing && styles.scrubberTrackActive]}>
          <View
            style={[
              styles.scrubberProgress,
              { width: `${progressRatio * 100}%` },
              isScrubbing && styles.scrubberProgressActive,
            ]}
          />
        </View>

        {/* Scrubbing Live Time Bubble */}
        {isScrubbing && (
          <View
            style={[
              styles.scrubIndicatorPill,
              {
                left: Math.max(
                  16,
                  Math.min(WINDOW_WIDTH - 88, progressRatio * WINDOW_WIDTH - 36)
                ),
              },
            ]}
          >
            <Text style={styles.scrubIndicatorText}>
              {formatTime(activeProgressSec)} / {formatTime(duration)}
            </Text>
          </View>
        )}
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
