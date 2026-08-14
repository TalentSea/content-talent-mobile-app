import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  findNodeHandle,
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
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import RNFS from 'react-native-fs';
import { registerInAppDownload } from '../../services/downloadService';
import type { ApiVideo } from '../../types/video';

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

export type DownloadItem = {
  resolution: string;
  label: string;
  url: string;
};

type VideoPlayerProps = {
  video?: ApiVideo;
  id?: number | string;
  category?: string;
  thumbnailUrl?: string;
  description?: string;
  uri: string;
  mp4Url?: string;
  downloadUrls?: DownloadItem[];
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
  onLoadRatio?: (ratio: number) => void;
  style?: ViewStyle;
  onClose?: () => void;
  onEnd?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
};

const RCTNativeVideoPlayer = requireNativeComponent<any>('NativeVideoPlayer');

export default function NativeVideoPlayer({
  video,
  id,
  category,
  thumbnailUrl,
  description,
  uri,
  mp4Url,
  downloadUrls = [],
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
  onLoadRatio,
  style,
  onClose,
  onEnd,
  onProgress,
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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
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
  const [downloadingLabel, setDownloadingLabel] = useState('');

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
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState.match(/inactive|background/)) {
        console.log('[NativeVideoPlayer] App state changed to background/inactive, pausing video');
        setPaused(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
        setShowSettingsMenu(false);
        setShowDownloadMenu(false);
      }, 4000);

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
    const newTime = Math.min(currentTime + 10, duration > 0 ? duration : currentTime + 10);
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

  // Download Options (240p, 480p, 720p, 1080p)
  const availableDownloadUrls: DownloadItem[] =
    downloadUrls.length > 0
      ? downloadUrls
      : uri.includes('.m3u8')
      ? [
          { resolution: '1080p', label: '1080p HD', url: uri.replace(/playlist\.m3u8.*$/, 'play_1080p.mp4') },
          { resolution: '720p', label: '720p HD', url: uri.replace(/playlist\.m3u8.*$/, 'play_720p.mp4') },
          { resolution: '480p', label: '480p SD', url: uri.replace(/playlist\.m3u8.*$/, 'play_480p.mp4') },
          { resolution: '240p', label: '240p SD', url: uri.replace(/playlist\.m3u8.*$/, 'play_240p.mp4') },
        ]
      : [{ resolution: '720p', label: 'Standard MP4', url: mp4Url || uri }];

  const handleStartDownload = async (targetUrl: string, label: string) => {
    setShowDownloadMenu(false);
    try {
      const videoTitle = title || 'video';
      const safeTitle = `${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${label.replace(/\s+/g, '_')}`;

      // In-App Private Sandboxed Document Directory
      const dirPath = `${RNFS.DocumentDirectoryPath}/offline_videos`;
      const exists = await RNFS.exists(dirPath);
      if (!exists) {
        await RNFS.mkdir(dirPath);
      }

      const destPath = `${dirPath}/${safeTitle}.mp4`;

      setIsDownloading(true);
      setDownloadingLabel(label);
      setDownloadProgress(0);

      const download = RNFS.downloadFile({
        fromUrl: targetUrl,
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
        const realVideoId = video?.id || (id ? Number(id) : Date.now());
        const downloadVideoObj: ApiVideo = video || {
          id: realVideoId,
          title: videoTitle,
          description: description || null,
          main_thumbnail_url: thumbnailUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
          category: category || 'General',
          tags: [],
          status: 'published',
          encode_progress: 100,
          is_playable: true,
          views: 0,
          duration: '00:00',
          published_at: null,
          scheduled_at: null,
          created_at: new Date().toISOString(),
        };

        registerInAppDownload({
          id: realVideoId,
          title: videoTitle,
          localPath: destPath,
          quality: label,
          downloadedAt: new Date().toISOString(),
          video: downloadVideoObj,
        });

        Alert.alert(
          'In-App Download Complete',
          `Saved "${videoTitle}" (${label}) to In-App Profile Downloads!`,
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
        'Could not save video in app.',
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
    const w = e.nativeEvent.width || 0;
    const h = e.nativeEvent.height || 0;

    if (d > 0) {
      setDuration(d);
    }
    if (w > 0 && h > 0 && onLoadRatio) {
      onLoadRatio(w / h);
    }
    setIsBuffering(false);
    setError(null);
  };

  const handleProgress = (e: any) => {
    const newCurrentTime = e.nativeEvent.currentTime || 0;
    const seekable = e.nativeEvent.seekableDuration || e.nativeEvent.duration || 0;
    setCurrentTime(newCurrentTime);

    if (seekable > 0 && seekable > duration) {
      setDuration(seekable);
    } else if (newCurrentTime > duration && duration > 0) {
      setDuration(newCurrentTime);
    }

    if (onProgress) {
      onProgress(newCurrentTime, seekable || duration || 0);
    }
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

  const progressPercent = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;

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

          if (activeCaptions.length > 0) {
            console.warn('[NativeVideoPlayer] Clearing side-loaded captions list to ensure smooth video stream playback...');
            setActiveCaptions([]);
            if (!hasEmbeddedCaptions) {
              setSelectedCaptionIndex(-1);
            }
            setRetryCount(prev => prev + 1);
            setError(null);
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

              {/* Settings Gear Button */}
              <Pressable
                style={styles.ytIconButton}
                onPress={() => {
                  setShowSettingsMenu(prev => !prev);
                  setShowMoreMenu(false);
                  setShowCaptionMenu(false);
                  setShowDownloadMenu(false);
                  setShowControls(true);
                }}
              >
                <Settings color="#FFFFFF" size={16} />
              </Pressable>

              {/* Playback Speed Menu */}
              <Pressable
                style={styles.ytIconButton}
                onPress={() => {
                  setShowMoreMenu(prev => !prev);
                  setShowCaptionMenu(false);
                  setShowSettingsMenu(false);
                  setShowDownloadMenu(false);
                }}
              >
                <Text style={styles.ytSpeedText}>{rate}x</Text>
              </Pressable>
            </View>
          </View>

          {/* Center Controls */}
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

          {/* Bottom Control Panel */}
          <View style={styles.bottomPanel} pointerEvents="box-none">
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
              {isDownloading ? (
                <Text style={styles.downloadProgressText}>
                  In-App Downloading ({downloadingLabel})... {downloadProgress}%
                </Text>
              ) : null}
            </View>

            {/* Progress Bar */}
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

              {/* In-App Download Quality Button */}
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  setShowDownloadMenu(prev => !prev);
                  setShowCaptionMenu(false);
                  setShowMoreMenu(false);
                  setShowSettingsMenu(false);
                }}
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
                  {style && (style as any).width ? (
                    <Minimize color="#FFFFFF" size={14} />
                  ) : (
                    <Maximize color="#FFFFFF" size={14} />
                  )}
                </Pressable>
              ) : null}
            </View>

            {/* Download Quality Options Menu */}
            {showDownloadMenu ? (
              <View style={styles.speedMenu}>
                <Text style={styles.menuHeaderTitle}>In-App Download Quality</Text>
                {availableDownloadUrls.map((item, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.speedItem}
                    onPress={() => handleStartDownload(item.url, item.label)}
                  >
                    <Text style={styles.speedText}>
                      {item.label} ({item.resolution})
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {/* Settings Menu Dropdown */}
            {showSettingsMenu ? (
              <View style={styles.speedMenu}>
                <Text style={styles.menuHeaderTitle}>Settings</Text>
                <Pressable
                  style={styles.speedItem}
                  onPress={() => {
                    setShowCaptionMenu(true);
                    setShowSettingsMenu(false);
                  }}
                >
                  <Text style={styles.speedText}>Captions / Subtitles ›</Text>
                </Pressable>
              </View>
            ) : null}

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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  player: {
    ...StyleSheet.absoluteFill,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFill,
  },
  controlsLayer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  topIconButton: {
    padding: 6,
    marginRight: 8,
  },
  backIconText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  playerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ytPillButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ytPillButtonActive: {
    backgroundColor: '#E50914',
  },
  ytPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  ytIconButton: {
    padding: 6,
  },
  ytIconButtonActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.4)',
    borderRadius: 4,
  },
  ccBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  ytSpeedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  ytSkipButton: {
    alignItems: 'center',
  },
  ytSkipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  ytCenterPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPanel: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  downloadProgressText: {
    color: '#FF0000',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarWrapper: {
    height: 20,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 2,
  },
  progressThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    position: 'absolute',
    top: -4,
    marginLeft: -6,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  volumeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  volumeSliderWrapper: {
    width: 60,
    height: 20,
    justifyContent: 'center',
  },
  volumeSliderBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  volumeSliderFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  volumeSliderThumb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: -3,
    marginLeft: -5,
  },
  speedMenu: {
    position: 'absolute',
    bottom: 50,
    right: 16,
    backgroundColor: '#1E1E2E',
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  speedItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  speedTextActive: {
    color: '#FF0000',
    fontWeight: '700',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  errorBox: {
    backgroundColor: '#1E1E2E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: '80%',
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});