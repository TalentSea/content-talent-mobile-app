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
        playbackRate={playbackRate}
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
        <View style={styles.controlsOverlay} pointerEvents="box-none">
          <View style={styles.bottomRow}>
            <Pressable style={styles.iconButton} onPress={togglePlayPause} hitSlop={8}>
              <Text style={styles.iconText}>{paused ? '▶' : '❚❚'}</Text>
            </Pressable>

            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>

            <View style={styles.rightControls}>
              <Pressable style={styles.iconButton} onPress={toggleMute} hitSlop={8}>
                <Text style={styles.iconText}>{isMuted ? '🔇' : '🔊'}</Text>
              </Pressable>

              <Pressable style={styles.iconButton} hitSlop={8}>
                <Text style={styles.iconText}>⛶</Text>
              </Pressable>

              <Pressable
                style={styles.iconButton}
                onPress={() => setShowMoreMenu(prev => !prev)}
                hitSlop={8}
              >
                <Text style={styles.iconText}>⋮</Text>
              </Pressable>
            </View>
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

          {showMoreMenu ? (
            <View style={styles.moreMenu}>
              <Text style={styles.moreMenuText}>Speed: {playbackRate}x</Text>
              <Text style={styles.moreMenuText}>
                Captions: {captions.length > 0 ? 'Available' : 'Off'}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    borderRadius: 0,
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
    zIndex: 11,
    elevation: 11,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 30,
    elevation: 30,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '300',
    lineHeight: 40,
  },
  controlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 8,
    paddingTop: 40,
    backgroundColor: 'transparent',
    zIndex: 20,
    elevation: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  rightControls: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarWrapper: {
    height: 16,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 2,
    overflow: 'visible',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
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
  moreMenu: {
    position: 'absolute',
    right: 12,
    bottom: 58,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: 6,
    padding: 10,
    zIndex: 40,
    elevation: 40,
  },
  moreMenuText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
  },
});