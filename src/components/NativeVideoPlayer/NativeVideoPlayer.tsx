import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  findNodeHandle,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
  ViewStyle,
} from 'react-native';
import { RCTNativeVideoPlayer } from './NativeVideoPlayerNative';
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
import { API_BASE_URL } from '../../constants/config';
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
  planTier?: 'basic' | 'premium' | 'none';
  autoStart?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  volume?: number;
  playbackRate?: number;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  title?: string;
  autoplay?: boolean;
  isFullscreen?: boolean;
  onToggleAutoplay?: () => void;
  onToggleFullscreen?: () => void;
  onLoadRatio?: (ratio: number) => void;
  style?: ViewStyle;
  onClose?: () => void;
  onEnd?: () => void;
  onProgress?: (currentTime: number, duration: number, isAdPlaying?: boolean) => void;
  onAdEvent?: (eventType: string) => void;
  initialPosition?: number;
};

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
  planTier = 'basic',
  autoStart = true,
  controls = true,
  muted = false,
  loop = false,
  volume = 1,
  playbackRate = 1,
  resizeMode = 'contain',
  title,
  autoplay,
  isFullscreen = false,
  onToggleAutoplay,
  onToggleFullscreen,
  onLoadRatio,
  style,
  onClose,
  onEnd,
  onProgress,
  onAdEvent,
  initialPosition = 0,
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const hasSentLoadEventRef = useRef(false);
  const hasAutoResumedRef = useRef(false);

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
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [currentVolume, setCurrentVolume] = useState(volume);
  
  const activeCaptions = captions || [];

  // MP4 Download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingLabel, setDownloadingLabel] = useState('');
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);

  const captionsCount = activeCaptions.length;
  const inbuiltCount = inbuiltCaptionTracks.length;

  useEffect(() => {
    if (inbuiltCount > 0 || hasInbuiltCaptionsProp) {
      setHasEmbeddedCaptions(true);
    }
    if (selectedCaptionIndex === -1 && (captionsCount > 0 || inbuiltCount > 0)) {
      setSelectedCaptionIndex(0);
    }
  }, [captionsCount, inbuiltCount, hasInbuiltCaptionsProp]);

  const currentCaptionUri = (selectedCaptionIndex !== -1 && activeCaptions[selectedCaptionIndex])
    ? activeCaptions[selectedCaptionIndex].uri
    : null;

  useEffect(() => {
    let isMounted = true;

    if (currentCaptionUri) {
      fetch(currentCaptionUri)
        .then(res => res.text())
        .then(vttText => {
          if (isMounted) {
            const parsed = parseVTTOrSRT(vttText);
            setSubtitleCues(parsed);
          }
        })
        .catch(err => {
          console.warn('[NativeVideoPlayer] Notice loading VTT subtitle URI:', err);
          if (isMounted) setSubtitleCues([]);
        });
    } else {
      setSubtitleCues([]);
    }

    return () => {
      isMounted = false;
    };
  }, [currentCaptionUri]);

  const activeCueText = selectedCaptionIndex !== -1 && subtitleCues.length > 0
    ? subtitleCues.find(c => currentTime >= c.start && currentTime <= c.end)?.text || null
    : null;

  useEffect(() => {
    setPaused(!autoStart);
    hasSentLoadEventRef.current = false;
    if (!uri || uri.trim() === '' || uri === API_BASE_URL) {
      setError('Stream Unavailable\nNo valid HLS stream URL is configured for this video on the server.');
      setIsBuffering(false);
    } else {
      setError(null);
    }
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
        setShowQualityMenu(false);
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
    if (!uri || uri.trim() === '' || uri === API_BASE_URL) {
      setError('Stream Unavailable\nNo valid HLS stream URL is configured for this video on the server.');
      return;
    }
    setError(null);
    setIsBuffering(true);
    hasSentLoadEventRef.current = false;
    setActiveUri(uri);
    setRetryCount(prev => prev + 1);
  };

  // Download Options (240p, 480p, 720p, 1080p) - Downloads unlocked ONLY for Premium Plan users
  const rawDownloadUrls: DownloadItem[] =
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

  const availableDownloadUrls: DownloadItem[] = rawDownloadUrls;

  const handleStartDownload = async (targetUrl: string, label: string) => {
    setShowDownloadMenu(false);
    if (planTier !== 'premium') {
      Alert.alert(
        'Upgrade to Premium Plan 👑',
        'Offline video downloads are exclusively available on the Premium Plan. Upgrade your subscription plan to download videos.',
      );
      return;
    }
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
          main_thumbnail_url: thumbnailUrl || null,
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
    hasSentLoadEventRef.current = true;
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

    // Automatic Resume Playback: inspect last_position_seconds and seek automatically
    if (initialPosition && initialPosition > 0 && !hasAutoResumedRef.current) {
      hasAutoResumedRef.current = true;
      seekTo(initialPosition);
      setCurrentTime(initialPosition);
    }
  };

  const handleProgress = (e: any) => {
    const newCurrentTime = e.nativeEvent.currentTime || 0;
    const seekable = e.nativeEvent.seekableDuration || e.nativeEvent.duration || 0;
    const isAdPlaying = Boolean(e.nativeEvent.isAdPlaying);

    if (!isAdPlaying) {
      setCurrentTime(newCurrentTime);

      if (seekable > 0 && seekable > duration) {
        setDuration(seekable);
      } else if (newCurrentTime > duration && duration > 0) {
        setDuration(newCurrentTime);
      }
    }

    if (onProgress) {
      onProgress(newCurrentTime, seekable || duration || 0, isAdPlaying);
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

    let lang = 'en';
    let label = 'English';

    if (nativeTextTracks.length > 0 && nativeTextTracks[selectedCaptionIndex]) {
      const track = nativeTextTracks[selectedCaptionIndex];
      lang = track.language || track.label || track.title || 'en';
      label = track.label || track.title || 'English';
    } else if (activeCaptions.length > 0 && activeCaptions[selectedCaptionIndex]) {
      const track = activeCaptions[selectedCaptionIndex];
      lang = track.language || 'en';
      label = track.label || 'English';
    } else if (inbuiltCaptionTracks.length > 0 && inbuiltCaptionTracks[selectedCaptionIndex]) {
      const track = inbuiltCaptionTracks[selectedCaptionIndex];
      lang = track.language || track.label || 'en';
      label = track.label || 'English';
    }

    return {
      type: 'language',
      value: lang,
      title: label,
      index: selectedCaptionIndex,
    };
  };

  const [activeUri, setActiveUri] = useState(uri);
  const [isCdnFallback, setIsCdnFallback] = useState(false);

  useEffect(() => {
    setActiveUri(uri);
    setError(null);
    setIsCdnFallback(false);
  }, [uri]);

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
        key={`${activeUri}-${retryCount}`}
        ref={playerRef}
        useTextureView={true}
        isFullscreen={isFullscreen}
        source={{
          uri: activeUri,
          type: activeUri.includes('.m3u8') ? 'm3u8' : 'mp4',
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
        onAdEvent={(e: any) => onAdEvent?.(e.nativeEvent?.eventType)}
        captionsEnabled={selectedCaptionIndex !== -1}
        selectedTextTrack={getSelectedTextTrack()}
        onError={(e: any) => {
          const { message = 'Failed to load video stream', errorCode } = e.nativeEvent || {};
          console.warn('[NativeVideoPlayer] Stream notice:', message, errorCode);

          const is403Error =
            (message && (message.includes('403') || message.includes('BAD_HTTP_STATUS'))) ||
            (errorCode && (String(errorCode).includes('403') || String(errorCode).includes('BAD_HTTP_STATUS')));

          if (is403Error && mp4Url && activeUri !== mp4Url) {
            console.log('[NativeVideoPlayer] HLS stream error, trying signed MP4 fallback:', mp4Url);
            setActiveUri(mp4Url);
            setError(null);
            setRetryCount(prev => prev + 1);
            return;
          }

          if (!hasSentLoadEventRef.current && (errorCode || message)) {
            setError(errorCode ? `${errorCode}:\n${message}` : message);
            setShowControls(true);
          }
        }}
      />

      {/* Subtitle Cue Overlay for External VTT Captions */}
      {activeCueText ? (
        <View
          style={[
            styles.subtitleOverlayContainer,
            isFullscreen && styles.subtitleOverlayContainerFullscreen,
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.subtitleTextBackground,
              isFullscreen && styles.subtitleTextBackgroundFullscreen,
            ]}
          >
            <Text
              style={[
                styles.subtitleText,
                isFullscreen && styles.subtitleTextFullscreen,
              ]}
            >
              {activeCueText}
            </Text>
          </View>
        </View>
      ) : null}

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
              {(onClose || (isFullscreen && onToggleFullscreen)) ? (
                <Pressable
                  style={[styles.topIconButton, isFullscreen && styles.topIconButtonFullscreen]}
                  onPress={() => {
                    if (isFullscreen && onToggleFullscreen) {
                      onToggleFullscreen();
                    } else if (onClose) {
                      onClose();
                    }
                  }}
                  hitSlop={12}
                >
                  <Text style={[styles.backIconText, isFullscreen && styles.backIconTextFullscreen]}>‹</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={[styles.topBarRight, isFullscreen && styles.topBarRightFullscreen]}>
              {/* Autoplay Toggle Switch Pill */}
              {onToggleAutoplay ? (
                <Pressable
                  style={[
                    styles.autoplayToggleTrack,
                    autoplay ? styles.autoplayToggleTrackOn : styles.autoplayToggleTrackOff,
                    isFullscreen && styles.autoplayToggleTrackFullscreen,
                  ]}
                  onPress={() => {
                    onToggleAutoplay();
                    setShowControls(true);
                  }}
                  hitSlop={8}
                >
                  <View
                    style={[
                      styles.autoplayToggleThumb,
                      autoplay ? styles.autoplayToggleThumbOn : styles.autoplayToggleThumbOff,
                      isFullscreen && (autoplay ? styles.autoplayToggleThumbOnFullscreen : styles.autoplayToggleThumbOffFullscreen),
                    ]}
                  >
                    {autoplay ? (
                      <Pause color="#111111" size={isFullscreen ? 11 : 9} fill="#111111" />
                    ) : (
                      <Play color="#666666" size={isFullscreen ? 11 : 9} fill="#666666" style={{ marginLeft: 1 }} />
                    )}
                  </View>
                </Pressable>
              ) : null}

              {/* CC Subtitles Badge Button */}
              <Pressable
                style={[
                  styles.ytIconButton,
                  selectedCaptionIndex !== -1 && styles.ytIconButtonActive,
                  isFullscreen && styles.ytIconButtonFullscreen,
                ]}
                onPress={() => {
                  setSelectedCaptionIndex(prev => (prev === -1 ? 0 : -1));
                  setShowControls(true);
                }}
              >
                <Text
                  style={[
                    styles.ccBadgeText,
                    selectedCaptionIndex !== -1 && styles.darkCcText,
                    isFullscreen && (selectedCaptionIndex !== -1 ? styles.darkCcTextFullscreen : styles.ccBadgeTextFullscreen),
                  ]}
                >
                  CC
                </Text>
              </Pressable>

              {/* Settings Gear Button */}
              <Pressable
                style={[styles.ytIconButton, isFullscreen && styles.ytIconButtonFullscreen]}
                onPress={() => {
                  setShowSettingsMenu(prev => !prev);
                  setShowMoreMenu(false);
                  setShowCaptionMenu(false);
                  setShowDownloadMenu(false);
                  setShowControls(true);
                }}
              >
                <Settings color="#FFFFFF" size={isFullscreen ? 24 : 18} />
              </Pressable>
            </View>
          </View>

          {/* Center Controls */}
          <View style={[styles.centerControlsRow, isFullscreen && styles.centerControlsRowFullscreen]} pointerEvents="box-none">
            {!error && !isBuffering ? (
              <>
                <Pressable
                  style={[styles.ytSkipButton, isFullscreen && styles.ytSkipButtonFullscreen]}
                  onPress={skipBackward}
                  hitSlop={8}
                >
                  <RotateCcw color="#FFFFFF" size={isFullscreen ? 38 : 26} />
                  <Text style={[styles.ytSkipText, isFullscreen && styles.ytSkipTextFullscreen]}>-10s</Text>
                </Pressable>

                <Pressable
                  style={[styles.ytCenterPlayButton, isFullscreen && styles.ytCenterPlayButtonFullscreen]}
                  onPress={togglePlayPause}
                >
                  {paused ? (
                    <Play
                      color="#FFFFFF"
                      size={isFullscreen ? 44 : 32}
                      style={{ marginLeft: isFullscreen ? 6 : 4 }}
                    />
                  ) : (
                    <Pause color="#FFFFFF" size={isFullscreen ? 44 : 32} />
                  )}
                </Pressable>

                <Pressable
                  style={[styles.ytSkipButton, isFullscreen && styles.ytSkipButtonFullscreen]}
                  onPress={skipForward}
                  hitSlop={8}
                >
                  <RotateCw color="#FFFFFF" size={isFullscreen ? 38 : 26} />
                  <Text style={[styles.ytSkipText, isFullscreen && styles.ytSkipTextFullscreen]}>+10s</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          {/* Bottom Control Panel */}
          <View style={[styles.bottomPanel, isFullscreen ? { paddingBottom: 28, paddingHorizontal: 28 } : null]} pointerEvents="box-none">
            {/* Duration Time Text and Progress Bar in the same horizontal line */}
            <View style={[styles.progressRow, isFullscreen && styles.progressRowFullscreen]}>
              <Text style={[styles.timeText, isFullscreen && styles.timeTextFullscreen]}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>

              <Pressable
                style={[styles.progressBarWrapperFlex, isFullscreen && styles.progressBarWrapperFlexFullscreen]}
                onLayout={e => setProgressBarWidth(e.nativeEvent.layout.width)}
                onPress={handleProgressBarPress}
              >
                <View style={[styles.progressBarBackground, isFullscreen && styles.progressBarBackgroundFullscreen]}>
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
                      isFullscreen && styles.progressThumbFullscreen,
                    ]}
                  />
                </View>
              </Pressable>
            </View>

            {isDownloading ? (
              <Text style={styles.downloadProgressText}>
                In-App Downloading ({downloadingLabel})... {downloadProgress}%
              </Text>
            ) : null}

            {/* Bottom Actions Row (Grouped in bottom right: Sound, Download, Fullscreen/Landscape) */}
            <View style={[styles.bottomActions, isFullscreen && styles.bottomActionsFullscreen]}>
              <View style={[styles.bottomRightGroup, isFullscreen && styles.bottomRightGroupFullscreen]}>
                <View style={[styles.volumeControlRow, isFullscreen && styles.volumeControlRowFullscreen]}>
                  <Pressable
                    style={[styles.actionButton, isFullscreen && styles.actionButtonFullscreen]}
                    onPress={toggleMute}
                    hitSlop={6}
                  >
                    {isMuted ? (
                      <VolumeX color="#FFFFFF" size={isFullscreen ? 22 : 16} />
                    ) : (
                      <Volume2 color="#FFFFFF" size={isFullscreen ? 22 : 16} />
                    )}
                  </Pressable>

                  <View
                    style={[styles.volumeSliderWrapper, isFullscreen && styles.volumeSliderWrapperFullscreen]}
                    onStartShouldSetResponder={() => true}
                    onResponderMove={handleVolumeChange}
                    onResponderGrant={handleVolumeChange}
                  >
                    <View style={[styles.volumeSliderBg, isFullscreen && styles.volumeSliderBgFullscreen]}>
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
                          isFullscreen && styles.volumeSliderThumbFullscreen,
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* In-App Download Quality Button */}
                <Pressable
                  style={[styles.actionButton, isFullscreen && styles.actionButtonFullscreen]}
                  onPress={() => {
                    if (planTier !== 'premium') {
                      Alert.alert(
                        'Upgrade to Premium Plan 👑',
                        'Offline video downloads are exclusively available on the Premium Plan. Upgrade your subscription plan to download videos.',
                      );
                      return;
                    }
                    setShowDownloadMenu(prev => !prev);
                    setShowCaptionMenu(false);
                    setShowMoreMenu(false);
                    setShowSettingsMenu(false);
                  }}
                  disabled={isDownloading}
                  hitSlop={6}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#FF0000" />
                  ) : (
                    <Download color="#FFFFFF" size={isFullscreen ? 22 : 16} />
                  )}
                </Pressable>

                {/* Landscape / Fullscreen Toggle Button */}
                {onToggleFullscreen ? (
                  <Pressable
                    style={[styles.actionButton, isFullscreen && styles.actionButtonFullscreen]}
                    onPress={onToggleFullscreen}
                    hitSlop={6}
                  >
                    {isFullscreen || (style && (style as any).width) ? (
                      <Minimize color="#FFFFFF" size={isFullscreen ? 22 : 16} />
                    ) : (
                      <Maximize color="#FFFFFF" size={isFullscreen ? 22 : 16} />
                    )}
                  </Pressable>
                ) : null}
              </View>
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
                    setShowQualityMenu(true);
                    setShowSettingsMenu(false);
                  }}
                >
                  <Text style={styles.speedText}>Video Quality ({selectedQuality}) ›</Text>
                </Pressable>
                <Pressable
                  style={styles.speedItem}
                  onPress={() => {
                    setShowMoreMenu(true);
                    setShowSettingsMenu(false);
                  }}
                >
                  <Text style={styles.speedText}>Playback Speed ({rate}x) ›</Text>
                </Pressable>
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

            {/* Video Quality Menu Dropdown */}
            {showQualityMenu ? (
              <View style={styles.speedMenu}>
                <Text style={styles.menuHeaderTitle}>Video Quality</Text>
                <Pressable
                  style={styles.speedItem}
                  onPress={() => {
                    setSelectedQuality('Auto');
                    setShowQualityMenu(false);
                    if (uri && uri.includes('.m3u8')) {
                      setActiveUri(uri);
                    }
                  }}
                >
                  <Text style={[styles.speedText, selectedQuality === 'Auto' && styles.speedTextActive]}>
                    Auto (Recommended){selectedQuality === 'Auto' ? '  ✓' : ''}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.speedItem}
                  onPress={() => {
                    setSelectedQuality('720p HD');
                    setShowQualityMenu(false);
                    if (uri && uri.includes('.m3u8')) {
                      setActiveUri(uri.replace(/playlist\.m3u8.*$/, 'play_720p.m3u8'));
                    }
                  }}
                >
                  <Text style={[styles.speedText, selectedQuality === '720p HD' && styles.speedTextActive]}>
                    720p HD{selectedQuality === '720p HD' ? '  ✓' : ''}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.speedItem}
                  onPress={() => {
                    setSelectedQuality('480p SD');
                    setShowQualityMenu(false);
                    if (uri && uri.includes('.m3u8')) {
                      setActiveUri(uri.replace(/playlist\.m3u8.*$/, 'play_480p.m3u8'));
                    }
                  }}
                >
                  <Text style={[styles.speedText, selectedQuality === '480p SD' && styles.speedTextActive]}>
                    480p SD{selectedQuality === '480p SD' ? '  ✓' : ''}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.speedItem}
                  onPress={() => {
                    setSelectedQuality('240p SD');
                    setShowQualityMenu(false);
                    if (uri && uri.includes('.m3u8')) {
                      setActiveUri(uri.replace(/playlist\.m3u8.*$/, 'play_240p.m3u8'));
                    }
                  }}
                >
                  <Text style={[styles.speedText, selectedQuality === '240p SD' && styles.speedTextActive]}>
                    240p SD{selectedQuality === '240p SD' ? '  ✓' : ''}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.speedItem}
                  onPress={() => {
                    if (planTier !== 'premium') {
                      Alert.alert(
                        'Upgrade to Premium Plan 👑',
                        '1080p Full HD video quality streaming is exclusively available on the Premium Plan. Your current plan supports up to 720p HD.',
                      );
                      return;
                    }
                    setSelectedQuality('1080p Full HD');
                    setShowQualityMenu(false);
                    if (uri && uri.includes('.m3u8')) {
                      setActiveUri(uri.replace(/playlist\.m3u8.*$/, 'play_1080p.m3u8'));
                    }
                  }}
                >
                  <Text style={[
                    styles.speedText,
                    selectedQuality === '1080p Full HD' && styles.speedTextActive,
                    planTier !== 'premium' && { color: '#9CA3AF' },
                  ]}>
                    {planTier === 'premium' ? '1080p Full HD' : '1080p HD 🔒 (Requires Premium Plan)'}
                    {selectedQuality === '1080p Full HD' ? '  ✓' : ''}
                  </Text>
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
                    : (activeCaptions.length > 0 || inbuiltCaptionTracks.length > 0
                      ? [...activeCaptions, ...inbuiltCaptionTracks.filter(inb => !activeCaptions.some(act => act.language === inb.language))]
                      : []);
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
    height: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  player: {
    ...StyleSheet.absoluteFill,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFill,
  },
  subtitleOverlayContainer: {
    position: 'absolute',
    bottom: 52,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleOverlayContainerFullscreen: {
    bottom: 70,
    left: 40,
    right: 40,
  },
  subtitleTextBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  subtitleTextBackgroundFullscreen: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  subtitleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitleTextFullscreen: {
    fontSize: 16,
    fontWeight: '600',
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
    paddingTop: 6,
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
  topIconButtonFullscreen: {
    padding: 8,
    marginRight: 12,
  },
  backIconText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  backIconTextFullscreen: {
    fontSize: 32,
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
    gap: 12,
  },
  topBarRightFullscreen: {
    gap: 18,
  },
  autoplayToggleTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  autoplayToggleTrackFullscreen: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
  },
  autoplayToggleTrackOn: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  autoplayToggleTrackOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  autoplayToggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoplayToggleThumbFullscreen: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  autoplayToggleThumbOn: {
    alignSelf: 'flex-end',
  },
  autoplayToggleThumbOff: {
    alignSelf: 'flex-start',
  },
  autoplayToggleThumbOnFullscreen: {
    alignSelf: 'flex-end',
  },
  autoplayToggleThumbOffFullscreen: {
    alignSelf: 'flex-start',
  },
  ytIconButton: {
    padding: 6,
  },
  ytIconButtonFullscreen: {
    padding: 8,
  },
  ytIconButtonActive: {
    backgroundColor: '#FFFFFF',
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
  ccBadgeTextFullscreen: {
    fontSize: 14,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 3,
  },
  darkCcText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  darkCcTextFullscreen: {
    fontSize: 14,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 3,
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
  centerControlsRowFullscreen: {
    gap: 56,
  },
  ytSkipButton: {
    width: 50,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ytSkipButtonFullscreen: {
    width: 70,
    height: 80,
  },
  ytSkipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    position: 'absolute',
    bottom: 4,
  },
  ytSkipTextFullscreen: {
    fontSize: 13,
    bottom: 6,
  },
  ytCenterPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytCenterPlayButtonFullscreen: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  bottomPanel: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  progressRowFullscreen: {
    gap: 14,
    marginBottom: 8,
  },
  progressBarWrapperFlex: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  progressBarWrapperFlexFullscreen: {
    height: 26,
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
  timeTextFullscreen: {
    fontSize: 15,
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
  progressBarBackgroundFullscreen: {
    height: 6,
    borderRadius: 3,
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
  progressThumbFullscreen: {
    width: 16,
    height: 16,
    borderRadius: 8,
    top: -5,
    marginLeft: -8,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  bottomActionsFullscreen: {
    marginTop: 8,
  },
  bottomRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomRightGroupFullscreen: {
    gap: 18,
  },
  volumeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  volumeControlRowFullscreen: {
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  actionButtonFullscreen: {
    padding: 8,
  },
  volumeSliderWrapper: {
    width: 50,
    height: 20,
    justifyContent: 'center',
  },
  volumeSliderWrapperFullscreen: {
    width: 70,
    height: 26,
  },
  volumeSliderBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  volumeSliderBgFullscreen: {
    height: 6,
    borderRadius: 3,
  },
  volumeSliderFill: {
    height: '100%',
    backgroundColor: '#FF0000',
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
  volumeSliderThumbFullscreen: {
    width: 14,
    height: 14,
    borderRadius: 7,
    top: -4,
    marginLeft: -7,
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
  cdnFallbackBanner: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    zIndex: 99,
    alignItems: 'center',
  },
  cdnFallbackText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  downloadToast: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 3500,
    elevation: 3500,
  },
  downloadToastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});