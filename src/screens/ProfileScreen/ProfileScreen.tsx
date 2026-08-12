import { Image, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth0 } from 'react-native-auth0';
import { Bell, ChevronLeft, CheckCircle, ChevronRight, History, Settings, User as UserIcon } from 'lucide-react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { colors } from '../../constants/colors';
import { useLibrary } from '../../contexts/LibraryContext';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useState } from 'react';
import type { PlayInfo } from '../../../types/video';
import { styles } from './styles';

export function ProfileScreen({ navigation }: any) {
  const { user } = useAuth0();
  const { items } = useLibrary();
  const historyItems = items.history.slice(0, 5);
  const [playingVideo, setPlayingVideo] = useState<PlayInfo | null>(null);
  const currentUser = user || { name: 'Streamr Creator', email: 'creator@streamr.app', picture: null, email_verified: true };

  const collectionRows = [
    { type: 'liked', title: 'Liked videos', subtitle: items.liked.length ? `${items.liked.length} videos` : 'Videos you’ve liked', thumbnail: items.liked[0]?.poster },
    { type: 'saved', title: 'Saved Videos', subtitle: items.saved.length ? `${items.saved.length} videos` : 'Keep videos for later', thumbnail: items.saved[0]?.poster },
    { type: 'downloads', title: 'Downloads', subtitle: items.downloads.length ? `${items.downloads.length} videos` : 'Watch videos offline', thumbnail: items.downloads[0]?.poster },
  ] as const;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}><ChevronLeft color={colors.text} size={24} /></Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIconButton} onPress={() => navigation.navigate('Notifications')}><Bell color={colors.text} size={20} /></Pressable>
          <Pressable style={styles.headerIconButton} onPress={() => navigation.navigate('Settings')}><Settings color={colors.text} size={20} /></Pressable>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSummary}>
          {currentUser.picture ? <Image source={{ uri: currentUser.picture }} style={styles.avatar} /> : <View style={styles.avatarFallback}><UserIcon color="#FFFFFF" size={32} /></View>}
          <Text style={styles.creatorName}>{currentUser.name}</Text>
          <Text style={styles.creatorEmail}>{currentUser.email}</Text>
          {currentUser.email_verified ? <View style={styles.creatorBadge}><CheckCircle color="#10B981" size={14} /><Text style={styles.creatorBadgeText}>Verified creator</Text></View> : null}
        </View>

        <Pressable style={styles.sectionHeader} onPress={() => navigation.navigate('Library', { type: 'history' })}>
          <Text style={styles.libraryTitle}>History</Text>
          <ChevronRight color={colors.text} size={24} style={styles.historyChevron} />
        </Pressable>
        {historyItems.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyShelf}>
            {historyItems.map(video => <Pressable key={video.stream_url} style={styles.historyCard} onPress={() => setPlayingVideo(video)}>
              {video.poster ? <Image source={{ uri: video.poster }} style={styles.historyThumbnail} /> : <View style={styles.historyThumbnailFallback} />}
              <Text style={styles.historyTitle} numberOfLines={2}>{video.title}</Text>
            </Pressable>)}
          </ScrollView>
        ) : <Pressable style={styles.historyEmpty} onPress={() => navigation.navigate('Home')}><History color={colors.primary} size={20} /><Text style={styles.historyEmptyText}>Start watching to build your history</Text><ChevronRight color={colors.muted} size={20} /></Pressable>}

        <Text style={styles.libraryTitle}>Library</Text>
        <View style={styles.libraryList}>
          {collectionRows.map(row => <View key={row.type}>
            <Pressable style={styles.libraryRow} onPress={() => navigation.navigate('Library', { type: row.type })}>
              {row.thumbnail ? <Image source={{ uri: row.thumbnail }} style={styles.libraryThumbnail} /> : <View style={styles.libraryThumbnailFallback} />}
              <View style={styles.libraryCopy}><Text style={styles.libraryRowTitle}>{row.title}</Text><Text style={styles.libraryRowSubtitle}>{row.subtitle}</Text></View>
            </Pressable>
          </View>)}
        </View>
      </ScrollView>
      <BottomNavBar activeTab="Profile" navigation={navigation} />
      <PlayerModal playingVideo={playingVideo} onClose={() => setPlayingVideo(null)} />
    </SafeAreaView>
  );
}
