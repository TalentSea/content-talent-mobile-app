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
import { Volume2, VolumeX } from 'lucide-react-native';

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
  autoplay?: boolean;
  onToggleAutoplay?: () => void;
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
  autoplay,
  onToggleAutoplay,
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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [hasEmbeddedCaptions, setHasEmbeddedCaptions] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);

  useEffect(() => {
    setPaused(!autoStart);
    setError(null);
    console.log('NativeVideoPlayer uri:', uri);
  }, [autoStart, uri]);

  useEffect(() => {
    setShowControls(controls);
  }, [controls]);

  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);

  useEffect(() => {
    if (controls && showControls && !paused && !error) {
      const timer = setTimeout(() => {
        setShowControls(false);
        setShowMoreMenu(false);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [controls, showControls, paused, error]);


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

  const handleVolumeChange = (e: any) => {
    const { locationX } = e.nativeEvent;
    const v = Math.min(Math.max(locationX / 60, 0), 1);
    setCurrentVolume(v);
    if (v > 0) setIsMuted(false);
    else setIsMuted(true);
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

  // TEMP DEBUG — remove once the button visibility issue is confirmed fixed
  console.log('[NativeVideoPlayer] render state', {
    controls,
    showControls,
    isBuffering,
    error,
    paused,
  });

  const handleEnd = () => {
    setPaused(true);
    setShowControls(true);
    onEnd?.();
  };

  const handleTracksAvailable = (e: any) => {
    const { textTrackCount, textTracks } = e.nativeEvent;
    if (textTrackCount > 0) {
      setHasEmbeddedCaptions(true);
    }
    console.log('Tracks Available:', textTracks);
  };

  const handleRetry = () => {
    setError(null);
    setIsBuffering(true);
    setRetryCount(prev => prev + 1);
  };

  return (
    <View style={[styles.container, style]}>
      <RCTNativeVideoPlayer
        key={`${uri}-${retryCount}`}
        ref={playerRef}
        source={{
          uri,
          captions,
        }}
        paused={paused}
        muted={isMuted}
        loop={loop}
        volume={currentVolume}
        playbackRate={rate}
        resizeMode={resizeMode}
        style={styles.player}
        onLoadStart={() => setIsBuffering(true)}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onBuffer={handleBuffer}
        onEnd={handleEnd}
        onTracksAvailable={handleTracksAvailable}
        captionsEnabled={captionsEnabled}
        onError={(e: any) => {
          setIsBuffering(false);
          const message = e.nativeEvent?.message ?? 'Unknown playback error';
          const errorCode = e.nativeEvent?.errorCode;
          console.warn('JS: Playback error:', errorCode, message);
          setError(errorCode ? `${errorCode}: ${message}` : message);
          setShowControls(true);
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

      {controls && showControls ? (
        <View style={styles.controlsLayer} pointerEvents="box-none">
          <View style={styles.topBar} pointerEvents="box-none">
            {onClose ? (
              <Pressable style={styles.topIconButton} onPress={onClose} hitSlop={12}>
                <Text style={styles.backIconText}>‹</Text>
              </Pressable>
            ) : (
              <View style={styles.topIconButton} />
            )}

            <Text style={styles.playerTitle} numberOfLines={1}>
              {title ?? ''}
            </Text>

            <View style={styles.topIconButton} />
          </View>

          <View style={styles.centerSpacer} pointerEvents="none" />

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
              <View style={styles.volumeControlRow}>
                <Pressable style={styles.actionButton} onPress={toggleMute}>
                  {isMuted ? (
                    <VolumeX color="#FFFFFF" size={16} />
                  ) : (
                    <Volume2 color="#FFFFFF" size={16} />
                  )}
                </Pressable>

                <View
                  style={styles.volumeSliderWrapper}
                  onStartShouldSetResponder={() => true}
                  onResponderMove={handleVolumeChange}
                  onResponderGrant={handleVolumeChange}
                >
                  <View style={styles.volumeSliderBg}>
                    <View
                      style={[
                        styles.volumeSliderFill,
                        { width: `${(isMuted ? 0 : currentVolume) * 100}%` as any },
                      ]}
                    />
                    <View
                      style={[
                        styles.volumeSliderThumb,
                        { left: `${(isMuted ? 0 : currentVolume) * 100}%` as any },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {onToggleAutoplay ? (
                <Pressable
                  style={[
                    styles.actionButton,
                    autoplay && styles.actionButtonActive,
                  ]}
                  onPress={() => {
                    onToggleAutoplay();
                    setShowControls(true);
                  }}
                >
                  <Text style={styles.actionText}>
                    {autoplay ? 'AUTO' : 'AUTO'}
                  </Text>
                </Pressable>
              ) : null}

              {(hasEmbeddedCaptions || captions.length > 0) ? (
                <Pressable
                  style={[
                    styles.actionButton,
                    captionsEnabled && styles.actionButtonActive,
                  ]}
                  onPress={() => {
                    setCaptionsEnabled(prev => !prev);
                    setShowControls(true);
                  }}
                >
                  <Text style={styles.actionText}>
                    {captionsEnabled ? 'CC ON' : 'CC OFF'}
                  </Text>
                </Pressable>
              ) : (
                <View style={[styles.actionButton, styles.actionButtonDisabled]}>
                  <Text style={styles.actionText}>CC</Text>
                </View>
              )}

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

            {showMoreMenu ? (
              <View style={styles.speedMenu}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                  <Pressable
                    key={speed}
                    style={styles.speedItem}
                    onPress={() => {
                      setRate(speed);
                      setShowMoreMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.speedText,
                        speed === rate && styles.speedTextActive,
                      ]}
                    >
                      {speed}x{speed === rate ? '  ✓' : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View
        style={styles.centerOverlay}
        pointerEvents={isBuffering ? 'none' : 'box-none'}
      >
        {error ? (
          <View style={styles.errorBox} pointerEvents="auto">
            <Text style={styles.errorText} numberOfLines={3}>
              Couldn't play this video{'\n'}
              {error}
            </Text>
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : isBuffering ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : controls && showControls ? (
          <Pressable style={styles.centerPlayButton} onPress={togglePlayPause}>
            <Text style={styles.centerPlayIcon}>{paused ? '▶' : 'Ⅱ'}</Text>
          </Pressable>
        ) : null}
      </View>
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
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  centerSpacer: {
    flex: 1,
  },

  backIconText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 32,
    marginLeft: -2,
  },

  centerPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  centerPlayIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 2,
  },

  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
    elevation: 25,
    // TEMP DEBUG — remove once the button visibility issue is confirmed fixed
    borderWidth: 2,
    borderColor: 'lime',
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
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  volumeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeSliderWrapper: {
    width: 60,
    height: 32,
    justifyContent: 'center',
    marginLeft: 4,
    marginRight: 8,
  },
  volumeSliderBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  volumeSliderFill: {
    height: '100%',
    backgroundColor: '#FF245E',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  volumeSliderThumb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    marginLeft: -5,
  },
  errorBox: {
    maxWidth: '80%',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(18,18,18,0.9)',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
  speedTextActive: {
    color: PLAYER_COLORS.accent,
  },
});