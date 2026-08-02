import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  findNodeHandle,
  PermissionsAndroid,
  Platform,
  Pressable,
  requireNativeComponent,
  StyleSheet,
  Text,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';
import {
  Download,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import RNFS from 'react-native-fs';

type CaptionTrack = {
  uri?: string;
  language?: string;
  label?: string;
  mimeType?: 'text/vtt' | 'application/x-subrip' | string;
  isInbuilt?: boolean;
  isDefault?: boolean;
  trackIndex?: number;
  kind?: 'subtitles' | 'captions' | 'descriptions';
};

type VideoPlayerProps = {
  uri: string;
  mp4Url?: string;
  captions?: CaptionTrack[];
  inbuiltCaptionTracks?: CaptionTrack[];
  hasInbuiltCaptions?: boolean;
  adTagUrl?: string;
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
  mp4Url,
  captions = [],
  inbuiltCaptionTracks = [],
  hasInbuiltCaptions: hasInbuiltCaptionsProp = false,
  adTagUrl,
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
  const [nativeTextTracks, setNativeTextTracks] = useState<any[]>([]);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number>(-1);
  const [showCaptionMenu, setShowCaptionMenu] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [activeCaptions, setActiveCaptions] = useState(captions);

  // MP4 Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    setActiveCaptions(captions);
    if (inbuiltCaptionTracks.length > 0 || hasInbuiltCaptionsProp) {
      setHasEmbeddedCaptions(true);
    }
  }, [captions, inbuiltCaptionTracks, hasInbuiltCaptionsProp]);

  useEffect(() => {
    setPaused(!autoStart);
    setError(null);
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
        setShowCaptionMenu(false);
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

  const skipForward = () => {
    const newTime = Math.min(currentTime + 10, duration);
    seekTo(newTime);
    setCurrentTime(newTime);
    setShowControls(true);
  };

  const skipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    seekTo(newTime);
    setCurrentTime(newTime);
    setShowControls(true);
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
    if (v === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleProgressBarPress = (e: any) => {
    if (!progressBarWidth || !duration) return;
    const { locationX } = e.nativeEvent;
    const percent = Math.min(Math.max(locationX / progressBarWidth, 0), 1);
    const newTime = percent * duration;
    seekTo(newTime);
    setCurrentTime(newTime);
    setShowControls(true);
  };

  const handleRetry = () => {
    setError(null);
    setIsBuffering(true);
    setRetryCount(prev => prev + 1);
  };

  // MP4 Video Download Functionality
  const handleDownloadMp4 = async () => {
    try {
      const downloadTargetUrl =
        mp4Url ||
        (uri.includes('.m3u8')
          ? uri.replace(/playlist\.m3u8.*$/, 'play_720p.mp4')
          : uri);
      const videoTitle = title || 'video';
      const safeTitle = videoTitle.replace(/[^a-zA-Z0-9]/g, '_');

      if (Platform.OS === 'android' && Platform.Version < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Storage permission is required to save MP4 videos.',
          );
          return;
        }
      }

      const destPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${safeTitle}.mp4`
          : `${RNFS.DocumentDirectoryPath}/${safeTitle}.mp4`;

      setIsDownloading(true);
      setDownloadProgress(0);

      const download = RNFS.downloadFile({
        fromUrl: downloadTargetUrl,
        toFile: destPath,
        background: true,
        progress: res => {
          if (res.contentLength > 0) {
            const percent = Math.floor(
              (res.bytesWritten / res.contentLength) * 100,
            );
            setDownloadProgress(percent);
          }
        },
      });

      const res = await download.promise;
      setIsDownloading(false);

      if (res.statusCode === 200 || res.statusCode === 206) {
        Alert.alert(
          'Download Complete',
          `Saved "${videoTitle}" to Downloads folder!`,
        );
      } else {
        Alert.alert(
          'Download Failed',
          `Server returned HTTP status ${res.statusCode}`,
        );
      }
    } catch (err: any) {
      setIsDownloading(false);
      console.error('[Download error]:', err);
      Alert.alert(
        'Download Failed',
        'Could not save MP4 video file directly.',
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLoad = (e: any) => {
    const d = e.nativeEvent.duration || 0;
    setDuration(d);
    setIsBuffering(false);
    setError(null);
  };

  const handleProgress = (e: any) => {
    setCurrentTime(e.nativeEvent.currentTime || 0);
  };

  const handleBuffer = (e: any) => {
    setIsBuffering(e.nativeEvent.isBuffering);
  };

  const handleEnd = () => {
    setPaused(true);
    if (onEnd) onEnd();
  };

  const handleTracksAvailable = (e: any) => {
    const { textTrackCount, textTracks } = e.nativeEvent;
    if (textTrackCount > 0) {
      setHasEmbeddedCaptions(true);
    }
    if (textTracks && textTracks.length > 0) {
      setNativeTextTracks(textTracks);
    }
  };

  const getSelectedTextTrack = () => {
    if (selectedCaptionIndex === -1) return { type: 'disabled' };

    if (nativeTextTracks.length > 0 && nativeTextTracks[selectedCaptionIndex]) {
      const track = nativeTextTracks[selectedCaptionIndex];
      return {
        type: 'language',
        value: track.language || track.label || track.title || 'en',
        index: selectedCaptionIndex,
      };
    }

    if (activeCaptions.length > 0 && activeCaptions[selectedCaptionIndex]) {
      const track = activeCaptions[selectedCaptionIndex];
      return {
        type: 'language',
        value: track.language || 'en',
        index: selectedCaptionIndex,
      };
    }

    if (inbuiltCaptionTracks.length > 0 && inbuiltCaptionTracks[selectedCaptionIndex]) {
      const track = inbuiltCaptionTracks[selectedCaptionIndex];
      return {
        type: 'language',
        value: track.language || track.label || 'en',
        index: selectedCaptionIndex,
      };
    }

    return { type: 'disabled' };
  };

  const formattedTextTracks = activeCaptions.map(c => ({
    title: c.label || 'English',
    language: c.language || 'en',
    type: c.mimeType || 'text/vtt',
    uri: c.uri,
  }));

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={[styles.container, style]}>
      <RCTNativeVideoPlayer
        key={`${uri}-${retryCount}`}
        ref={playerRef}
        source={{
          uri,
          type: 'm3u8',
          captions: activeCaptions,
          textTracks: formattedTextTracks,
          adTagUrl,
        }}
        textTracks={formattedTextTracks}
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
        captionsEnabled={selectedCaptionIndex !== -1}
        selectedTextTrack={getSelectedTextTrack()}
        onError={(e: any) => {
          const { message = 'Failed to load video stream', errorCode } = e.nativeEvent || {};

          if (activeCaptions.length > 0 && (message.includes('404') || message.includes('BAD_HTTP_STATUS') || String(errorCode).includes('IO'))) {
            console.warn('[NativeVideoPlayer] Side-loaded VTT returned 404, clearing side-loaded captions list...');
            setActiveCaptions([]);
            if (!hasEmbeddedCaptions) {
              setSelectedCaptionIndex(-1);
            }
            return;
          }

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
            setShowCaptionMenu(false);
          }}
        />
      ) : null}

      {controls && showControls ? (
        <View style={styles.controlsLayer} pointerEvents="box-none">
          {/* YouTube-Style Top Header Bar */}
          <View style={styles.topBar} pointerEvents="box-none">
            <View style={styles.topBarLeft}>
              {onClose ? (
                <Pressable style={styles.topIconButton} onPress={onClose} hitSlop={12}>
                  <Text style={styles.backIconText}>‹</Text>
                </Pressable>
              ) : null}
              <Text style={styles.playerTitle} numberOfLines={1}>
                {title ?? ''}
              </Text>
            </View>

            <View style={styles.topBarRight}>
              {/* Autoplay Toggle Switch */}
              {onToggleAutoplay ? (
                <Pressable
                  style={[
                    styles.ytPillButton,
                    autoplay && styles.ytPillButtonActive,
                  ]}
                  onPress={() => {
                    onToggleAutoplay();
                    setShowControls(true);
                  }}
                >
                  <Text style={styles.ytPillText}>
                    {autoplay ? 'AUTO ON' : 'AUTO OFF'}
                  </Text>
                </Pressable>
              ) : null}

              {/* CC Subtitles Badge Button */}
              {(hasEmbeddedCaptions || hasInbuiltCaptionsProp || (inbuiltCaptionTracks && inbuiltCaptionTracks.length > 0) || (activeCaptions && activeCaptions.length > 0)) ? (
                <Pressable
                  style={[
                    styles.ytIconButton,
                    selectedCaptionIndex !== -1 && styles.ytIconButtonActive,
                  ]}
                  onPress={() => {
                    const tracksList = nativeTextTracks.length > 0
                      ? nativeTextTracks
                      : (activeCaptions.length > 0 ? activeCaptions : inbuiltCaptionTracks);
                    const availableTracksCount = tracksList.length;
                    if (availableTracksCount <= 1) {
                      setSelectedCaptionIndex(prev => (prev === -1 ? 0 : -1));
                    } else {
                      setShowCaptionMenu(prev => !prev);
                      setShowMoreMenu(false);
                    }
                    setShowControls(true);
                  }}
                >
                  <Text style={styles.ccBadgeText}>CC</Text>
                </Pressable>
              ) : null}


              {/* Playback Speed Menu */}
              <Pressable
                style={styles.ytIconButton}
                onPress={() => {
                  setShowMoreMenu(prev => !prev);
                  setShowCaptionMenu(false);
                }}
              >
                <Text style={styles.ytSpeedText}>{rate}x</Text>
              </Pressable>
            </View>
          </View>

          {/* YouTube-Style Center Controls (Rewind 10s, Play/Pause, Forward 10s) */}
          <View style={styles.centerControlsRow} pointerEvents="box-none">
            {!error && !isBuffering ? (
              <>
                <Pressable style={styles.ytSkipButton} onPress={skipBackward}>
                  <RotateCcw color="#FFFFFF" size={26} />
                  <Text style={styles.ytSkipText}>-10s</Text>
                </Pressable>

                <Pressable style={styles.ytCenterPlayButton} onPress={togglePlayPause}>
                  {paused ? (
                    <Play color="#FFFFFF" size={32} style={{ marginLeft: 4 }} />
                  ) : (
                    <Pause color="#FFFFFF" size={32} />
                  )}
                </Pressable>

                <Pressable style={styles.ytSkipButton} onPress={skipForward}>
                  <RotateCw color="#FFFFFF" size={26} />
                  <Text style={styles.ytSkipText}>+10s</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          {/* YouTube-Style Bottom Control Panel */}
          <View style={styles.bottomPanel} pointerEvents="box-none">
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
              {isDownloading ? (
                <Text style={styles.downloadProgressText}>
                  Downloading MP4... {downloadProgress}%
                </Text>
              ) : null}
            </View>

            {/* YouTube Red Progress Bar */}
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

            {/* Bottom Actions Row */}
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


              <Pressable
                style={styles.actionButton}
                onPress={handleDownloadMp4}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FF0000" />
                ) : (
                  <Download color="#FFFFFF" size={14} />
                )}
              </Pressable>

              {onToggleFullscreen ? (
                <Pressable style={styles.actionButton} onPress={onToggleFullscreen}>
                  <Maximize color="#FFFFFF" size={14} />
                </Pressable>
              ) : null}
            </View>

            {/* Caption Menu Dropdown */}
            {showCaptionMenu ? (
              <View style={styles.speedMenu}>
                <Pressable
                  style={styles.speedItem}
                  onPress={() => {
                    setSelectedCaptionIndex(-1);
                    setShowCaptionMenu(false);
                  }}
                >
                  <Text
                    style={[
                      styles.speedText,
                      selectedCaptionIndex === -1 && styles.speedTextActive,
                    ]}
                  >
                    Off{selectedCaptionIndex === -1 ? '  ✓' : ''}
                  </Text>
                </Pressable>

                {(() => {
                  const tracksList = nativeTextTracks.length > 0
                    ? nativeTextTracks
                    : (activeCaptions.length > 0 ? activeCaptions : inbuiltCaptionTracks);
                  return tracksList.map((track: any, idx: number) => {
                    let baseLabel = track.label || track.title || (track.language ? track.language.toUpperCase() : `Track ${idx + 1}`);
                    if (track.isInbuilt && !baseLabel.includes('(Inbuilt)')) {
                      baseLabel = `${baseLabel} (Inbuilt)`;
                    }
                    const duplicateCount = tracksList.filter(t => (t.label || t.title || (t.language ? t.language.toUpperCase() : '')) === baseLabel).length;
                    if (duplicateCount > 1) {
                      baseLabel = idx === 0 ? `${baseLabel} (Auto)` : `${baseLabel} (${idx + 1})`;
                    }
                    const isSelected = selectedCaptionIndex === idx;
                    return (
                      <Pressable
                        key={idx}
                        style={styles.speedItem}
                        onPress={() => {
                          setSelectedCaptionIndex(idx);
                          setShowCaptionMenu(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.speedText,
                            isSelected && styles.speedTextActive,
                          ]}
                        >
                          {baseLabel}{isSelected ? '  ✓' : ''}
                        </Text>
                      </Pressable>
                    );
                  });
                })()}
              </View>
            ) : null}

            {/* Speed Menu Dropdown */}
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

      {(error || isBuffering) ? (
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
          ) : (
            <ActivityIndicator size="large" color="#FF0000" />
          )}
        </View>
      ) : null}
    </View>
  );
}

const PLAYER_COLORS = {
  white: '#FFFFFF',
  mutedWhite: 'rgba(255,255,255,0.72)',
  overlayTop: 'rgba(0,0,0,0.4)',
  overlayBottom: 'rgba(0,0,0,0.8)',
  progressTrack: 'rgba(255,255,255,0.35)',
  progressFill: '#FF0000',
  accent: '#FF0000',
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
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
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    flex: 1,
  },
  backIconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
    marginLeft: -2,
  },

  // YouTube-Style Pill & Badge Buttons
  ytPillButton: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ytPillButtonActive: {
    backgroundColor: '#FF0000',
  },
  ytPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  ytIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ytIconButtonActive: {
    backgroundColor: '#FF0000',
  },
  ccBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  ytSpeedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // YouTube-Style Center Controls (Rewind 10s, Play/Pause, Forward 10s)
  centerControlsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  ytCenterPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ytSkipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ytSkipText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },

  centerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
    elevation: 25,
  },
  bottomPanel: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
  downloadProgressText: {
    color: '#FF0000',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarWrapper: {
    height: 22,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'visible',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF0000',
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: '#FF0000',
  },
  bottomActions: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minWidth: 32,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FF0000',
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
    width: 130,
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
    color: '#FF0000',
  },
});