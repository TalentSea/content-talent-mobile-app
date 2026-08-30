import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bookmark,
  ChevronRight,
  Clock,
  Crown,
  Download,
  Heart,
  HelpCircle,
  LogOut,
  Settings,
  X,
} from 'lucide-react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useUserActivity } from '../../hooks/useUserActivity';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { useDownloads } from '../../hooks/useDownloads';
import {
  clearSessionTokens,
  getCurrentUser,
  isUserLoggedIn,
  isUserSubscribed,
  subscribeAuthChange,
} from '../../services/api/authService';
import type { DownloadedVideoItem } from '../../services/downloadService';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

function getInitials(name?: string | null): string {
  if (!name) return 'AK';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState(getCurrentUser());
  const [selectedFeed, setSelectedFeed] = useState<'none' | 'history' | 'liked' | 'saved' | 'downloads'>('none');

  useEffect(() => {
    const unsub = subscribeAuthChange(() => {
      setUser(getCurrentUser());
    });
    return unsub;
  }, []);

  const { videos, loading, reload } = useVideos();
  const { likedVideos, savedVideos } = useUserActivity(videos);
  const { history, removeWatchHistoryItem } = useWatchHistory(videos);
  const { downloadedVideos } = useDownloads(videos);
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);

  const userIsLoggedIn = isUserLoggedIn();
  const userIsSubscribed = isUserSubscribed();

  const currentUser = user || {
    name: 'Alex Kumar',
    email: 'alex.kumar@gmail.com',
    avatar_url: undefined,
    role: 'guest',
  };

  const historyVideos: ApiVideo[] = history.map(h => h.video);

  const activeVideos: ApiVideo[] =
    selectedFeed === 'history'
      ? historyVideos
      : selectedFeed === 'liked'
      ? likedVideos
      : selectedFeed === 'saved'
      ? savedVideos
      : downloadedVideos
          .map((item: DownloadedVideoItem) => item?.video || (item as any))
          .filter((v: ApiVideo) => v && v.id);

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await clearSessionTokens();
          if (navigation) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        },
      },
    ]);
  };

  const handleSupportPress = () => {
    Alert.alert(
      'Help & Support',
      'For assistance, feedback, or subscription queries, contact our support team at support@streamr.app or visit streamr.app/help.',
      [{ text: 'OK' }],
    );
  };

  const membershipLabel = userIsSubscribed
    ? currentUser.chosen_plan
      ? `${currentUser.chosen_plan} Member`
      : 'Premium Member'
    : userIsLoggedIn
    ? 'Free Member'
    : 'Guest Member';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Top Profile Card matching Screenshot */}
          <Pressable
            style={styles.userCard}
            onPress={() => navigation?.navigate('Subscription')}
          >
            <View style={styles.avatarGradientBox}>
              {currentUser.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {getInitials(currentUser.name || 'Alex Kumar')}
                </Text>
              )}
            </View>

            <View style={styles.userInfoContainer}>
              <Text style={styles.userNameText}>
                {currentUser.name || 'Alex Kumar'}
              </Text>
              <Text style={styles.userEmailText}>
                {currentUser.email || 'alex.kumar@gmail.com'}
              </Text>
              <View style={styles.membershipRow}>
                <Crown size={14} color="#A855F7" />
                <Text style={styles.membershipText}>{membershipLabel}</Text>
              </View>
            </View>

            <ChevronRight color="#475569" size={20} style={styles.cardChevron} />
          </Pressable>

          {/* Menu Items List */}
          <View style={styles.menuList}>
            {/* 1. My Subscription */}
            <Pressable
              style={styles.menuItemRow}
              onPress={() => navigation?.navigate('Subscription')}
            >
              <View style={styles.menuIconCircle}>
                <Crown size={20} color="#A855F7" />
              </View>
              <Text style={styles.menuItemTitle}>My Subscription</Text>
              <ChevronRight size={18} color="#475569" style={styles.menuItemChevron} />
            </Pressable>

            {/* 2. Watch History */}
            <Pressable
              style={styles.menuItemRow}
              onPress={() =>
                setSelectedFeed(prev => (prev === 'history' ? 'none' : 'history'))
              }
            >
              <View style={styles.menuIconCircle}>
                <Clock size={20} color="#38BDF8" />
              </View>
              <Text style={styles.menuItemTitle}>Watch History</Text>
              <ChevronRight size={18} color="#475569" style={styles.menuItemChevron} />
            </Pressable>

            {/* 3. Liked Videos */}
            <Pressable
              style={styles.menuItemRow}
              onPress={() =>
                setSelectedFeed(prev => (prev === 'liked' ? 'none' : 'liked'))
              }
            >
              <View style={styles.menuIconCircle}>
                <Heart size={20} color="#F43F5E" />
              </View>
              <Text style={styles.menuItemTitle}>Liked Videos</Text>
              <ChevronRight size={18} color="#475569" style={styles.menuItemChevron} />
            </Pressable>

            {/* 4. Saved Videos */}
            <Pressable
              style={styles.menuItemRow}
              onPress={() =>
                setSelectedFeed(prev => (prev === 'saved' ? 'none' : 'saved'))
              }
            >
              <View style={styles.menuIconCircle}>
                <Bookmark size={20} color="#F59E0B" />
              </View>
              <Text style={styles.menuItemTitle}>Saved Videos</Text>
              <ChevronRight size={18} color="#475569" style={styles.menuItemChevron} />
            </Pressable>

            {/* 5. Downloads */}
            <Pressable
              style={styles.menuItemRow}
              onPress={() =>
                setSelectedFeed(prev => (prev === 'downloads' ? 'none' : 'downloads'))
              }
            >
              <View style={styles.menuIconCircle}>
                <Download size={20} color="#10B981" />
              </View>
              <Text style={styles.menuItemTitle}>Downloads</Text>
              <ChevronRight size={18} color="#475569" style={styles.menuItemChevron} />
            </Pressable>

            {/* 6. Settings */}
            <Pressable
              style={styles.menuItemRow}
              onPress={() => navigation?.navigate('Settings')}
            >
              <View style={styles.menuIconCircle}>
                <Settings size={20} color="#A1A1AA" />
              </View>
              <Text style={styles.menuItemTitle}>Settings</Text>
              <ChevronRight size={18} color="#475569" style={styles.menuItemChevron} />
            </Pressable>

            {/* 7. Help & Support */}
            <Pressable style={styles.menuItemRow} onPress={handleSupportPress}>
              <View style={styles.menuIconCircle}>
                <HelpCircle size={20} color="#C084FC" />
              </View>
              <Text style={styles.menuItemTitle}>Help & Support</Text>
              <ChevronRight size={18} color="#475569" style={styles.menuItemChevron} />
            </Pressable>

            {/* 8. Logout */}
            <Pressable style={styles.menuItemRow} onPress={handleLogout}>
              <View style={styles.menuIconCircle}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={styles.menuItemTitle}>Logout</Text>
              <ChevronRight size={18} color="#475569" style={styles.menuItemChevron} />
            </Pressable>
          </View>

          {/* Expandable Feed Section (History / Liked / Saved / Downloads) */}
          {selectedFeed !== 'none' ? (
            <View style={styles.activeSectionContainer}>
              <View style={styles.activeSectionHeader}>
                <Text style={styles.activeSectionTitle}>
                  {selectedFeed === 'history'
                    ? 'Watch History'
                    : selectedFeed === 'liked'
                    ? 'Liked Videos'
                    : selectedFeed === 'saved'
                    ? 'Saved Videos'
                    : 'Downloaded Videos'}
                </Text>
                <Pressable onPress={() => setSelectedFeed('none')}>
                  <X size={18} color="#94A3B8" />
                </Pressable>
              </View>

              <VerticalList
                videos={activeVideos}
                numColumns={2}
                refreshing={loading}
                isContinueWatching={true}
                onRefresh={reload}
                onPressVideo={playVideo}
                onDeleteVideo={
                  selectedFeed === 'history'
                    ? (v: any) => removeWatchHistoryItem(v.id)
                    : undefined
                }
                emptyText={`No ${selectedFeed} videos found.`}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Permanent Bottom Navigation Bar */}
      <BottomNavBar activeTab="Profile" navigation={navigation} />

      {/* Video Player Modal */}
      <PlayerModal
        playingVideo={playingVideo}
        onUpgradeSubscription={() => {
          closePlayer();
          navigation?.navigate('Subscription');
        }}
        onClose={closePlayer}
      />
    </SafeAreaView>
  );
}
