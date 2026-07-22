import React, { useState } from 'react';
import { Modal, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import Orientation from 'react-native-orientation-locker';

import { NativeVideoPlayer } from '../../components/NativeVideoPlayer';
import type { PlayInfo } from '../../../types/video';
import { styles } from '../PlayerScreen/styles';

export function PlayerModal({
  playingVideo,
  onClose,
}: {
  playingVideo: PlayInfo | null;
  onClose: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { width, height } = useWindowDimensions();

  function handleClose() {
    Orientation.lockToPortrait();
    onClose();
  }

  function toggleFullscreen() {
    setIsFullscreen(prev => {
      const next = !prev;

      if (next) {
        Orientation.lockToLandscape();
      } else {
        Orientation.lockToPortrait();
      }

      return next;
    });
  }

  return (
    <Modal
      visible={!!playingVideo}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.playerScreen}>
        <StatusBar barStyle="light-content" hidden />

        <View
          style={
            isFullscreen
              ? { width, height, backgroundColor: '#000000' }
              : styles.playerVideoArea
          }
        >
          {playingVideo ? (
            <NativeVideoPlayer
              uri={playingVideo.stream_url}
              title={playingVideo.title}
              autoStart={true}
              controls={true}
              loop={false}
              muted={false}
              volume={1}
              playbackRate={1}
              resizeMode="contain"
              captions={[]}
              style={
                isFullscreen
                  ? { width, height, borderRadius: 0 }
                  : styles.videoPlayer
              }
              onToggleFullscreen={toggleFullscreen}
              onClose={handleClose}
            />
          ) : null}
        </View>

        {!isFullscreen && playingVideo ? (
          <View style={styles.playerInfo}>
            <Text style={styles.playerTitle} numberOfLines={2}>
              {playingVideo.title}
            </Text>

            {playingVideo.description ? (
              <Text style={styles.playerDescription} numberOfLines={4}>
                {playingVideo.description}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}