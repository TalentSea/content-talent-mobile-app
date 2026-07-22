import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  findNodeHandle,
  Pressable,
  requireNativeComponent,
  StyleSheet,
  Text,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';

type CaptionTrack = {
  uri: string;
  language?: string;
  label?: string;
  mimeType?: 'text/vtt' | 'application/x-subrip';
};

type VideoPlayerProps = {
  uri: string;
  captions?: CaptionTrack[];
  autoStart?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  volume?: number;
  playbackRate?: number;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  title?: string;
  onToggleFullscreen?: () => void;
  style?: ViewStyle;
  onClose?: () => void;
  onEnd?: () => void;
};

const RCTNativeVideoPlayer = requireNativeComponent<any>('NativeVideoPlayer');

export default function NativeVideoPlayer({
  uri,
  captions = [],
  autoStart = true,
  controls = true,
  muted = false,
  loop = false,
  volume = 1,
  playbackRate = 1,
  resizeMode = 'contain',
  title,
  onToggleFullscreen,
  style,
  onClose,
  onEnd,
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);

  const [paused, setPaused] = useState(!autoStart);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(controls);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [rate, setRate] = useState(playbackRate);

  useEffect(() => {
    setPaused(!autoStart);
      console.log('NativeVideoPlayer uri:', uri);
  }, [autoStart, uri]);

  useEffect(() => {
    setShowControls(controls);
  }, [controls]);

  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);

  useEffect(() => {
    if (controls && showControls && !paused) {
      const timer = setTimeout(() => {
        setShowControls(false);
        setShowMoreMenu(false);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [controls, showControls, paused]);


  const seekTo = (seconds: number) => {
    const node = findNodeHandle(playerRef.current);

    if (node) {
      UIManager.dispatchViewManagerCommand(node, 1, [seconds]);
    }
  };

  const togglePlayPause = () => {
    setPaused(prev => !prev);
    setShowControls(true);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    setShowControls(true);
  };

  const handleProgressBarPress = (event: any) => {
    if (duration > 0 && progressBarWidth > 0) {
      const { locationX } = event.nativeEvent;
      const pct = Math.min(Math.max(locationX / progressBarWidth, 0), 1);
      const targetTime = pct * duration;

      setCurrentTime(targetTime);
      seekTo(targetTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleProgress = (e: any) => {
    setIsBuffering(false);

    const { currentTime: current, duration: dur } = e.nativeEvent;

    setCurrentTime(current);
    setDuration(dur);
  };

  const handleLoad = (e: any) => {
    setIsBuffering(false);

    const { duration: dur } = e.nativeEvent;
    setDuration(dur);
  };

  const handleBuffer = (e: any) => {
    const { isBuffering: buffering } = e.nativeEvent;
    setIsBuffering(buffering);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={[styles.container, style]}>
      <RCTNativeVideoPlayer
        ref={playerRef}
        source={{
          uri,
          captions,
        }}
        paused={paused}
        muted={isMuted}
        loop={loop}
        volume={volume}
        playbackRate={rate}
        resizeMode={resizeMode}
        style={styles.player}
        onLoadStart={() => setIsBuffering(true)}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onBuffer={handleBuffer}
        onEnd={() => {
          setPaused(true);
          setShowControls(true);
          onEnd?.();
        }}
        onError={(e: any) => {
          setIsBuffering(false);
          console.warn('JS: Playback error:', e.nativeEvent.message);
        }}
      />

      {controls ? (
        <Pressable
          style={styles.touchOverlay}
          onPress={() => {
            setShowControls(prev => !prev);
            setShowMoreMenu(false);
          }}
        />
      ) : null}

      {isBuffering ? (
        <View style={styles.spinnerWrapper} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : null}

      {onClose && controls && showControls ? (
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      ) : null}

      {controls && showControls ? (
        <View style={styles.controlsLayer} pointerEvents="box-none">
          <View style={styles.topBar} pointerEvents="box-none">
            {onClose ? (
              <Pressable style={styles.topIconButton} onPress={onClose} hitSlop={12}>
                <Text style={styles.topIconText}>×</Text>
              </Pressable>
            ) : (
              <View style={styles.topIconButton} />
            )}

            <Text style={styles.playerTitle} numberOfLines={1}>
              {title ?? ''}
            </Text>

            <View style={styles.topIconButton} />
          </View>

          <View style={styles.centerControls} pointerEvents="box-none">
            <Pressable style={styles.centerPlayButton} onPress={togglePlayPause}>
              <Text style={styles.centerPlayIcon}>{paused ? '▶' : 'Ⅱ'}</Text>
            </Pressable>
          </View>

          <View style={styles.bottomPanel} pointerEvents="box-none">
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            <Pressable
              style={styles.progressBarWrapper}
              onLayout={e => setProgressBarWidth(e.nativeEvent.layout.width)}
              onPress={handleProgressBarPress}
            >
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` as any },
                  ]}
                />
                <View
                  style={[
                    styles.progressThumb,
                    { left: `${progressPercent}%` as any },
                  ]}
                />
              </View>
            </Pressable>

            <View style={styles.bottomActions}>
              <Pressable style={styles.actionButton} onPress={toggleMute}>
                <Text style={styles.actionText}>{isMuted ? 'MUTE' : 'VOL'}</Text>
              </Pressable>

              <Pressable style={styles.actionButton}>
                <Text style={styles.actionText}>
                  {captions.length > 0 ? 'CC' : 'CC OFF'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionButton}
                onPress={() => setShowMoreMenu(prev => !prev)}
              >
                <Text style={styles.actionText}>{rate}x</Text>
              </Pressable>

              <Pressable style={styles.actionButton} onPress={onToggleFullscreen}>
                <Text style={styles.actionText}>⛶</Text>
              </Pressable>
            </View>
          </View>

          {showMoreMenu ? (
            <View style={styles.speedMenu}>
              {[0.5, 1, 1.5, 2].map(speed => (
                <Pressable
                  key={speed}
                  style={styles.speedItem}
                  onPress={() => {
                    setRate(speed);
                    setShowMoreMenu(false);
                  }}
                >
                  <Text style={styles.speedText}>{speed}x</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const PLAYER_COLORS = {
  white: '#FFFFFF',
  mutedWhite: 'rgba(255,255,255,0.72)',
  overlayTop: 'rgba(0,0,0,0.35)',
  overlayBottom: 'rgba(0,0,0,0.72)',
  progressTrack: 'rgba(255,255,255,0.35)',
  progressFill: '#FFFFFF',
  accent: '#FF245E',
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  player: {
    width: '100%',
    height: '100%',
  },
  touchOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  spinnerWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 30,
    elevation: 30,
  },
  controlsLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    elevation: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topIconText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 36,
  },
  playerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayIcon: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginLeft: 2,
  },
  bottomPanel: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeText: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarWrapper: {
    height: 22,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'visible',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  bottomActions: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minWidth: 42,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  speedMenu: {
    position: 'absolute',
    right: 14,
    bottom: 62,
    width: 120,
    borderRadius: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(18,18,18,0.96)',
    zIndex: 40,
    elevation: 40,
  },
  speedItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});