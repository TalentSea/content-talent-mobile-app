import React from 'react';
import { Modal, StatusBar, Text, View } from 'react-native';

import { NativeVideoPlayer } from '../../components/NativeVideoPlayer';
import type { PlayInfo } from '../../../types/video';
import { styles } from '../PlayerScreen/styles';

export function PlayerModal({
  playingVideo,
  onClose,
}: {
  playingVideo: PlayInfo | null;
  onClose: () => void;
})

 {
 console.log('PLAYER MODAL STREAM:', playingVideo?.stream_url);
  return (
    <Modal
      visible={!!playingVideo}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.playerScreen}>
        <StatusBar barStyle="light-content" hidden />

        <View style={styles.playerVideoArea}>
          {playingVideo ? (
            <NativeVideoPlayer
              uri={playingVideo.stream_url}
              autoStart={true}
              controls={true}
              loop={false}
              muted={false}
              volume={1}
              playbackRate={1}
              resizeMode="contain"
              captions={[]}
              style={styles.videoPlayer}
              onClose={onClose}
            />
          ) : null}
        </View>

        {playingVideo ? (
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