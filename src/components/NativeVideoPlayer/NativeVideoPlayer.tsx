import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  findNodeHandle,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  requireNativeComponent,
  Text,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Gauge,
  Lock,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  SlidersHorizontal,
  Unlock,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import RNFS from 'react-native-fs';
import { styles } from './styles';

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
  category?: string;
  autoplay?: boolean;
  onToggleAutoplay?: () => void;
  onToggleFullscreen?: () => void;
  onLoadRatio?: (ratio: number) => void;
  style?: ViewStyle;
  onClose?: () => void;
  onEnd?: () => void;
  onDownloadComplete?: () => void;
  onDownloadStart?: () => void;
};

const RCTNativeVideoPlayer = requireNativeComponent<any>('NativeVideoPlayer');

export default function NativeVideoPlayer({
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
  autoplay = true,
  onToggleAutoplay,
  onToggleFullscreen,
  onLoadRatio,
  style,
  onClose,
  onEnd,
  onDownloadComplete,
  onDownloadStart,
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);

  const [paused, setPaused] = useState(!autoStart);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [isAutoplayOn, setIsAutoplayOn] = useState(autoplay);

  // Settings Bottom Sheet State
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeSettingsSubMenu, setActiveSettingsSubMenu] = useState<'main' | 'quality' | 'speed' | 'captions' | 'more'>('main');
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (480p)');

  // Lock Screen State
  const [isLocked, setIsLocked] = useState(false);
  const [showUnlockNotice, setShowUnlockNotice] = useState(false);

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showDownloadToast, setShowDownloadToast] = useState(false);
  const [rate, setRate] = useState(playbackRate);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [hasEmbeddedCaptions, setHasEmbeddedCaptions] = useState(false);
  const [nativeTextTracks, setNativeTextTracks] = useState<any[]>([]);
  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState<number>(-1);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [activeCaptions, setActiveCaptions] = useState(captions);

  // MP4 Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [_downloadProgress, setDownloadProgress] = useState(0);
  const [_downloadingLabel, setDownloadingLabel] = useState('');

  useEffect(() => {
    setIsAutoplayOn(autoplay);
  }, [autoplay]);

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
    setIsMuted(muted);
  }, [muted]);

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

      if (Platform.OS === 'android' && Platform.Version < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to save MP4 videos.');
          return;
        }
      }

      const destPath = `${RNFS.DocumentDirectoryPath}/${safeTitle}.mp4`;

      setIsDownloading(true);
      setDownloadingLabel(label);
      setDownloadProgress(0);
      onDownloadStart?.();

      const download = RNFS.downloadFile({
        fromUrl: targetUrl,
        toFile: destPath,
        background: true,
        progress: res => {
          if (res.contentLength > 0) {
            const percent = Math.floor((res.bytesWritten / res.contentLength) * 100);
            setDownloadProgress(percent);
          }
        },
      });

      const res = await download.promise;
      setIsDownloading(false);

      if (res.statusCode === 200 || res.statusCode === 206) {
        setShowDownloadToast(true);
        setTimeout(() => setShowDownloadToast(false), 3000);
        onDownloadComplete?.();
      } else {
        Alert.alert('Download Failed', `Server returned HTTP status ${res.statusCode}`);
      }
    } catch (err: any) {
      setIsDownloading(false);
      console.error('[Download error]:', err);
      Alert.alert('Download Failed', 'Could not save MP4 video file directly.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLoad = (e: any) => {
    const d = e.nativeEvent.duration || 0;
    if (d > 0) {
      setDuration(d);
    }
    const w = e.nativeEvent.width;
    const h = e.nativeEvent.height;
    if (w && h && w > 0 && h > 0) {
      const ratio = w / h;
      if (onLoadRatio) onLoadRatio(ratio);
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
  };

  const handleBuffer = (e: any) => {
    setIsBuffering(e.nativeEvent.isBuffering);
  };

  // Prevent premature stopping in the middle of pre-roll ad transitions or buffering
  const handleEnd = () => {
    if (duration > 0 && currentTime < duration - 2) {
      return;
    }
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

  const handleTouchScreen = () => {
    if (isLocked) {
      setShowUnlockNotice(true);
      setTimeout(() => setShowUnlockNotice(false), 3000);
      return;
    }
    setShowControls(prev => !prev);
  };

  return (
    <View style={[styles.container, style]}>
      {/* 1. Base Native Player */}
      <RCTNativeVideoPlayer
        key={`${uri}-${retryCount}`}
        ref={playerRef}
        useTextureView={true}
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

      {/* 2. Full-Screen Touch Interceptor */}
      <Pressable style={styles.touchOverlay} onPress={handleTouchScreen} />

      {/* 3. Small Compact Download Completed Toast Notification */}
      {showDownloadToast ? (
        <View style={styles.downloadToast}>
          <Text style={styles.downloadToastText}>Download completed</Text>
        </View>
      ) : null}

      {/* 4. Screen Lock Overlay Notice */}
      {isLocked && showUnlockNotice && (
        <Pressable
          style={styles.lockOverlay}
          onPress={() => {
            setIsLocked(false);
            setShowUnlockNotice(false);
            setShowControls(true);
          }}
        >
          <Unlock color="#FFFFFF" size={18} />
          <Text style={styles.lockOverlayText}>Screen Locked (Touch to unlock)</Text>
        </Pressable>
      )}

      {/* 5. Controls Overlay */}
      {controls && showControls && !isLocked ? (
        <View style={styles.controlsLayer} pointerEvents="box-none">
          {/* Top Bar Overlay (Clean, no title text on player) */}
          <View style={styles.topBar} pointerEvents="box-none">
            <View style={styles.topBarLeft}>
              {onClose ? (
                <Pressable style={styles.topIconButton} onPress={onClose} hitSlop={12}>
                  <ChevronDown color="#FFFFFF" size={26} />
                </Pressable>
              ) : null}
            </View>

            {/* Top Bar Right Group: Autoplay Switch, CC Badge, Settings Gear */}
            <View style={styles.topBarRight}>
              {/* Autoplay Capsule Switch */}
              <Pressable
                style={[
                  styles.autoplaySwitchTrack,
                  isAutoplayOn ? styles.autoplayTrackOn : styles.autoplayTrackOff,
                ]}
                onPress={() => {
                  const nextState = !isAutoplayOn;
                  setIsAutoplayOn(nextState);
                  if (onToggleAutoplay) onToggleAutoplay();
                  setShowControls(true);
                }}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.autoplayKnob,
                    isAutoplayOn ? styles.autoplayKnobRight : styles.autoplayKnobLeft,
                  ]}
                >
                  {isAutoplayOn ? (
                    <Pause size={9} color="#000000" fill="#000000" />
                  ) : (
                    <Play size={9} color="#000000" fill="#000000" style={styles.playIconOffset} />
                  )}
                </View>
              </Pressable>

              {/* CC Badge Button for Subtitles */}
              <Pressable
                style={[
                  styles.ytIconButton,
                  selectedCaptionIndex !== -1 && styles.ytIconButtonActive,
                ]}
                onPress={() => {
                  setSelectedCaptionIndex(prev => (prev === -1 ? 0 : -1));
                  setShowControls(true);
                }}
              >
                <Text style={styles.ccBadgeText}>CC</Text>
              </Pressable>

              {/* Settings Gear Icon */}
              <Pressable
                style={styles.ytIconButton}
                onPress={() => {
                  setActiveSettingsSubMenu('main');
                  setShowSettingsMenu(true);
                  setShowControls(true);
                }}
              >
                <Settings color="#FFFFFF" size={19} />
              </Pressable>
            </View>
          </View>

          {/* Center Play/Pause & Skip Buttons */}
          <View style={styles.centerControlsRow} pointerEvents="box-none">
            {!error && !isBuffering ? (
              <>
                <Pressable style={styles.ytSkipButton} onPress={skipBackward}>
                  <RotateCcw color="#FFFFFF" size={26} />
                  <Text style={styles.ytSkipText}>-10s</Text>
                </Pressable>

                <Pressable style={styles.ytCenterPlayButton} onPress={togglePlayPause}>
                  {paused ? (
                    <Play color="#FFFFFF" size={30} fill="#FFFFFF" style={styles.centerPlayIconOffset} />
                  ) : (
                    <Pause color="#FFFFFF" size={30} fill="#FFFFFF" />
                  )}
                </Pressable>

                <Pressable style={styles.ytSkipButton} onPress={skipForward}>
                  <RotateCw color="#FFFFFF" size={26} />
                  <Text style={styles.ytSkipText}>+10s</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          {/* Bottom Panel (Red Progress Bar and Duration on Same Line) */}
          <View style={styles.bottomPanel} pointerEvents="box-none">
            {/* Same Line Duration Text & Red Seek Bar */}
            <View style={styles.progressAndTimeRow}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
              <Pressable
                style={styles.progressBarWrapperInLine}
                onLayout={e => setProgressBarWidth(e.nativeEvent.layout.width)}
                onPress={handleProgressBarPress}
              >
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
                  <View style={[styles.progressThumb, { left: `${progressPercent}%` as any }]} />
                </View>
              </Pressable>
            </View>

            {/* Bottom Actions Row */}
            <View style={styles.bottomActions}>
              <View style={styles.volumeControlRow}>
                <Pressable style={styles.actionButton} onPress={toggleMute}>
                  {isMuted ? <VolumeX color="#FFFFFF" size={16} /> : <Volume2 color="#FFFFFF" size={16} />}
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
                onPress={() => {
                  setShowDownloadMenu(true);
                }}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FF0000" />
                ) : (
                  <Download color="#FFFFFF" size={15} />
                )}
              </Pressable>

              {onToggleFullscreen ? (
                <Pressable style={styles.actionButton} onPress={onToggleFullscreen}>
                  {style && (style as any).width ? (
                    <Minimize color="#FFFFFF" size={15} />
                  ) : (
                    <Maximize color="#FFFFFF" size={15} />
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      {/* 6. Download Bottom Sheet Modal (Sliding from bottom of device screen) */}
      <Modal
        visible={showDownloadMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDownloadMenu(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable style={styles.sheetBackdropTouch} onPress={() => setShowDownloadMenu(false)} />
          <View style={styles.sheetContainer}>
            <View style={styles.grabHandle} />
            <Text style={styles.sheetSubTitle}>Download Quality</Text>
            {availableDownloadUrls.map((item, idx) => (
              <Pressable
                key={idx}
                style={styles.sheetOptionItem}
                onPress={() => handleStartDownload(item.url, item.label)}
              >
                <Text style={styles.sheetOptionText}>
                  {item.label} ({item.resolution})
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* 7. Settings Bottom Sheet Modal (Sliding from bottom of device screen) */}
      <Modal
        visible={showSettingsMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowSettingsMenu(false);
          setActiveSettingsSubMenu('main');
        }}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable
            style={styles.sheetBackdropTouch}
            onPress={() => {
              setShowSettingsMenu(false);
              setActiveSettingsSubMenu('main');
            }}
          />
          <View style={styles.sheetContainer}>
            {/* Grab Handle */}
            <View style={styles.grabHandle} />

            {/* Main Settings Menu List */}
            {activeSettingsSubMenu === 'main' && (
              <View>
                {/* Quality */}
                <Pressable
                  style={styles.sheetMenuItem}
                  onPress={() => setActiveSettingsSubMenu('quality')}
                >
                  <View style={styles.sheetMenuLeft}>
                    <SlidersHorizontal color="#0F0F0F" size={20} />
                    <Text style={styles.sheetMenuTitle}>Quality</Text>
                  </View>
                  <View style={styles.sheetMenuRight}>
                    <Text style={styles.sheetMenuValue}>{selectedQuality}</Text>
                    <ChevronRight color="#606060" size={18} />
                  </View>
                </Pressable>

                {/* Playback Speed */}
                <Pressable
                  style={styles.sheetMenuItem}
                  onPress={() => setActiveSettingsSubMenu('speed')}
                >
                  <View style={styles.sheetMenuLeft}>
                    <Gauge color="#0F0F0F" size={20} />
                    <Text style={styles.sheetMenuTitle}>Playback speed</Text>
                  </View>
                  <View style={styles.sheetMenuRight}>
                    <Text style={styles.sheetMenuValue}>
                      {rate === 1 ? '1x' : `${rate}x`}
                    </Text>
                    <ChevronRight color="#606060" size={18} />
                  </View>
                </Pressable>

                {/* Captions */}
                <Pressable
                  style={styles.sheetMenuItem}
                  onPress={() => setActiveSettingsSubMenu('captions')}
                >
                  <View style={styles.sheetMenuLeft}>
                    <Text style={styles.darkCcText}>CC</Text>
                    <Text style={styles.sheetMenuTitle}>Captions</Text>
                  </View>
                  <View style={styles.sheetMenuRight}>
                    <Text style={styles.sheetMenuValue}>
                      {selectedCaptionIndex === -1 ? 'Off' : 'English'}
                    </Text>
                    <ChevronRight color="#606060" size={18} />
                  </View>
                </Pressable>

                {/* Lock screen */}
                <Pressable
                  style={styles.sheetMenuItem}
                  onPress={() => {
                    setIsLocked(true);
                    setShowSettingsMenu(false);
                    setShowControls(false);
                    setShowUnlockNotice(true);
                    setTimeout(() => setShowUnlockNotice(false), 3500);
                  }}
                >
                  <View style={styles.sheetMenuLeft}>
                    <Lock color="#0F0F0F" size={20} />
                    <Text style={styles.sheetMenuTitle}>Lock screen</Text>
                  </View>
                </Pressable>

                {/* More */}
                <Pressable
                  style={styles.sheetMenuItem}
                  onPress={() => setActiveSettingsSubMenu('more')}
                >
                  <View style={styles.sheetMenuLeft}>
                    <Settings color="#0F0F0F" size={20} />
                    <Text style={styles.sheetMenuTitle}>More</Text>
                  </View>
                  <View style={styles.sheetMenuRight}>
                    <ChevronRight color="#606060" size={18} />
                  </View>
                </Pressable>
              </View>
            )}

            {/* Quality Sub-Menu */}
            {activeSettingsSubMenu === 'quality' && (
              <View>
                <Pressable
                  style={styles.sheetSubHeader}
                  onPress={() => setActiveSettingsSubMenu('main')}
                >
                  <ChevronLeft color="#0F0F0F" size={20} />
                  <Text style={styles.sheetSubTitle}>Quality</Text>
                </Pressable>
                {['Auto (480p)', '1080p HD', '720p HD', '480p SD', '360p SD', '240p SD'].map(q => (
                  <Pressable
                    key={q}
                    style={styles.sheetOptionItem}
                    onPress={() => {
                      setSelectedQuality(q);
                      setShowSettingsMenu(false);
                      setActiveSettingsSubMenu('main');
                    }}
                  >
                    <Text
                      style={[
                        styles.sheetOptionText,
                        q === selectedQuality && styles.sheetOptionTextActive,
                      ]}
                    >
                      {q}
                    </Text>
                    {q === selectedQuality && (
                      <Text style={styles.sheetOptionCheckMark}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Playback Speed Sub-Menu */}
            {activeSettingsSubMenu === 'speed' && (
              <View>
                <Pressable
                  style={styles.sheetSubHeader}
                  onPress={() => setActiveSettingsSubMenu('main')}
                >
                  <ChevronLeft color="#0F0F0F" size={20} />
                  <Text style={styles.sheetSubTitle}>Playback speed</Text>
                </Pressable>
                {[
                  { label: '0.25x', val: 0.25 },
                  { label: '0.5x', val: 0.5 },
                  { label: '0.75x', val: 0.75 },
                  { label: 'Normal (1x)', val: 1 },
                  { label: '1.25x', val: 1.25 },
                  { label: '1.5x', val: 1.5 },
                  { label: '1.75x', val: 1.75 },
                  { label: '2x', val: 2 },
                ].map(speedObj => (
                  <Pressable
                    key={speedObj.val}
                    style={styles.sheetOptionItem}
                    onPress={() => {
                      setRate(speedObj.val);
                      setShowSettingsMenu(false);
                      setActiveSettingsSubMenu('main');
                    }}
                  >
                    <Text
                      style={[
                        styles.sheetOptionText,
                        speedObj.val === rate && styles.sheetOptionTextActive,
                      ]}
                    >
                      {speedObj.label}
                    </Text>
                    {speedObj.val === rate && (
                      <Text style={styles.sheetOptionCheckMark}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Captions Sub-Menu */}
            {activeSettingsSubMenu === 'captions' && (
              <View>
                <Pressable
                  style={styles.sheetSubHeader}
                  onPress={() => setActiveSettingsSubMenu('main')}
                >
                  <ChevronLeft color="#0F0F0F" size={20} />
                  <Text style={styles.sheetSubTitle}>Captions</Text>
                </Pressable>
                <Pressable
                  style={styles.sheetOptionItem}
                  onPress={() => {
                    setSelectedCaptionIndex(-1);
                    setShowSettingsMenu(false);
                    setActiveSettingsSubMenu('main');
                  }}
                >
                  <Text
                    style={[
                      styles.sheetOptionText,
                      selectedCaptionIndex === -1 && styles.sheetOptionTextActive,
                    ]}
                  >
                    Off
                  </Text>
                  {selectedCaptionIndex === -1 && (
                    <Text style={styles.sheetOptionCheckMark}>✓</Text>
                  )}
                </Pressable>
                <Pressable
                  style={styles.sheetOptionItem}
                  onPress={() => {
                    setSelectedCaptionIndex(0);
                    setShowSettingsMenu(false);
                    setActiveSettingsSubMenu('main');
                  }}
                >
                  <Text
                    style={[
                      styles.sheetOptionText,
                      selectedCaptionIndex !== -1 && styles.sheetOptionTextActive,
                    ]}
                  >
                    English
                  </Text>
                  {selectedCaptionIndex !== -1 && (
                    <Text style={styles.sheetOptionCheckMark}>✓</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* More Sub-Menu */}
            {activeSettingsSubMenu === 'more' && (
              <View>
                <Pressable
                  style={styles.sheetSubHeader}
                  onPress={() => setActiveSettingsSubMenu('main')}
                >
                  <ChevronLeft color="#0F0F0F" size={20} />
                  <Text style={styles.sheetSubTitle}>More Options</Text>
                </Pressable>
                <Pressable
                  style={styles.sheetOptionItem}
                  onPress={() => {
                    setShowSettingsMenu(false);
                    setShowDownloadMenu(true);
                  }}
                >
                  <Text style={styles.sheetOptionText}>Download MP4 Video</Text>
                </Pressable>
                <Pressable
                  style={styles.sheetOptionItem}
                  onPress={() => {
                    setShowSettingsMenu(false);
                    Alert.alert('Stats for nerds', `Codec: H.264/AAC\nResolution: 1920x1080\nViewport: ${resizeMode}`);
                  }}
                >
                  <Text style={styles.sheetOptionText}>Stats for nerds</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Buffering & Error Overlay */}
      {(error || isBuffering) && !isLocked ? (
        <View style={styles.centerOverlay} pointerEvents={isBuffering ? 'none' : 'box-none'}>
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
