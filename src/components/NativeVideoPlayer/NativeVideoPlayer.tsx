import React, { useRef, useState, useEffect } from 'react';
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

type NativeVideoPlayerProps = {
  source: { uri: string; type?: string };
  paused?: boolean;
  style?: ViewStyle;
  onLoadStart?: () => void;
  onLoad?: (event: { nativeEvent: { duration: number } }) => void;
  onProgress?: (event: { nativeEvent: { currentTime: number; duration: number } }) => void;
  onBuffer?: (event: { nativeEvent: { isBuffering: boolean } }) => void;
  onError?: (event: { nativeEvent: { message: string } }) => void;
};

const RCTNativeVideoPlayer = requireNativeComponent<any>('NativeVideoPlayer');

type VideoPlayerProps = {
  uri: string;
  style?: ViewStyle;
  onClose?: () => void;
};

export default function NativeVideoPlayer({ uri, style, onClose }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  // Auto-hide controls timer
  useEffect(() => {
    if (showControls && !paused) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showControls, paused]);

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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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


  const videoUri = uri;
  console.log('JS: NativeVideoPlayer Render state:', { showControls, paused, isBuffering, duration, currentTime });

  return (
    <View style={[styles.container, style]}>
      <RCTNativeVideoPlayer
        ref={playerRef}
        source={{ uri: videoUri }}
        paused={paused}
        style={styles.player}
        onLoadStart={() => {
          console.log('JS: onLoadStart');
          setIsBuffering(true);
        }}
        onLoad={(e: any) => {
          console.log('JS: onLoad', e.nativeEvent);
          handleLoad(e);
        }}
        onProgress={(e: any) => {
          console.log('JS: onProgress', e.nativeEvent);
          handleProgress(e);
        }}
        onBuffer={(e: any) => {
          console.log('JS: onBuffer', e.nativeEvent);
          handleBuffer(e);
        }}
        onError={(e: any) => {
          setIsBuffering(false);
          console.warn('JS: Playback error:', e.nativeEvent.message);
        }}
      />

      {/* Unified tap overlay — always present, toggles controls */}
      <Pressable
        style={styles.touchOverlay}
        onPress={() => setShowControls(prev => !prev)}
      />

      {isBuffering && (
        <View style={styles.spinnerWrapper} pointerEvents="none">
          <ActivityIndicator size="large" color="#FF245E" />
        </View>
      )}

      {showControls && (
        <View style={styles.controlsOverlay} pointerEvents="box-none">
          {/* Header row with Close button */}
          <View style={styles.header}>
            <View style={styles.flexShim} />
            {onClose && (
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Large Center Play/Pause button */}
          <View style={styles.centerControls} pointerEvents="box-none">
            <Pressable style={styles.playButton} onPress={togglePlayPause}>
              <Text style={styles.playIcon}>{paused ? '▶' : '❚❚'}</Text>
            </Pressable>
          </View>

          {/* Bottom control bar with slider and timers */}
          <View style={styles.bottomControls} pointerEvents="box-none">
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

            <Pressable
              style={styles.progressBarWrapper}
              onLayout={e => setProgressBarWidth(e.nativeEvent.layout.width)}
              onPress={handleProgressBarPress}
            >
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
              </View>
            </Pressable>

            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  player: {
    width: '100%',
    height: '100%',
  },
  touchOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 12,
    elevation: 12,
    backgroundColor: 'transparent',
  },
  spinnerWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
    elevation: 10,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    padding: 12,
    zIndex: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexShim: {
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF245E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    width: 38,
    textAlign: 'center',
  },
  progressBarWrapper: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%' as any,
    backgroundColor: '#FF245E',
  },
});