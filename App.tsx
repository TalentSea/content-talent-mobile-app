import React, {useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import Video from 'react-native-video';

const videos = [
  {
    id: '1',
    title: 'Big Buck Bunny',
    uri: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: '2',
    title: 'Sintel Trailer',
    uri: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  },
  {
    id: '3',
    title: 'Bear Video',
    uri: 'https://www.w3schools.com/html/movie.mp4',
  },
];

export default function App() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Video Cards</Text>

      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => {
          const isPlaying = playingId === item.id;

          return (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>

              <Pressable onPress={() => setPlayingId(isPlaying ? null : item.id)}>
                <Video
                  source={{uri: item.uri}}
                  style={styles.video}
                  controls
                  paused={!isPlaying}
                  resizeMode="cover"
                  onError={error => console.log('Video error:', error)}
                />

                {!isPlaying && (
                  <View style={styles.overlay}>
                    <Text style={styles.playText}>▶ Play</Text>
                  </View>
                )}
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    padding: 16,
    color: '#111',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#222',
  },
  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
});