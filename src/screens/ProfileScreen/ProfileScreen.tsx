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
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Heart,
  HelpCircle,
  LogIn,
  LogOut,
  Settings,
} from 'lucide-react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useDownloads } from '../../hooks/useDownloads';
import { useUserActivity } from '../../hooks/useUserActivity';
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

  useEffect(() => {
    const unsub = subscribeAuthChange(() => {
      setUser(getCurrentUser());
    });
    return unsub;
  }, []);

  const { videos, loading, reload } = useVideos();
  const { downloadedVideos } = useDownloads(videos);
  const { savedVideos, likedVideos } = useUserActivity(videos);
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);

  const userIsLoggedIn = isUserLoggedIn();
  const userIsSubscribed = isUserSubscribed();

  const currentUser = user || {
    name: 'Guest Visitor',
    email: 'Sign in to access your profile',
    avatar_url: undefined,
    role: 'guest',
  };

  const downloadedVideoList: ApiVideo[] = downloadedVideos
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
      'For assistance or subscription queries, contact our support team at support@streamr.app or visit streamr.app/help.',
      [{ text: 'OK' }],
    );
  };

  const membershipLabel = userIsSubscribed
    ? (currentUser as any).chosen_plan
      ? `${(currentUser as any).chosen_plan} Member`
      : 'Premium Member'
    : userIsLoggedIn
      ? 'Free Member (No Plan)'
      : 'Guest Visitor';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color="#FFFFFF" size={20} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell color="#FFFFFF" size={18} />
          </Pressable>
          <Pressable
            style={styles.headerIconButton}
            onPress={handleSupportPress}
          >
            <HelpCircle color="#FFFFFF" size={18} />
          </Pressable>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings color="#FFFFFF" size={18} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Top User Identity Card: Photo, Name, Email, Role / Plan Status */}
          <Pressable
            style={styles.userCard}
            onPress={() => navigation?.navigate('Subscription')}
          >
            <View style={styles.avatarGradientBox}>
              {currentUser.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {getInitials(currentUser.name || 'Guest Visitor')}
                </Text>
              )}
            </View>

            <View style={styles.userInfoContainer}>
              <Text style={styles.userNameText}>
                {currentUser.name || 'Guest Visitor'}
              </Text>
              <Text style={styles.userEmailText}>
                {currentUser.email || 'Sign in to access your profile'}
              </Text>
              <View style={styles.membershipRow}>
                <Crown size={14} color={userIsSubscribed ? '#A855F7' : '#94A3B8'} />
                <Text style={[styles.membershipText, !userIsSubscribed && { color: '#94A3B8' }]}>
                  {membershipLabel}
                </Text>
              </View>
            </View>

            <ChevronRight color="#475569" size={20} style={styles.cardChevron} />
          </Pressable>

          {/* Profile Menu List */}
          <View style={{ gap: 4, marginBottom: 16 }}>
            {/* 1. My Subscription (Navigates to SubscriptionScreen) */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 4,
              }}
              onPress={() => navigation?.navigate('Subscription')}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#181926',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
              >
                <Crown size={20} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
                  My Subscription
                </Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>
                  {userIsSubscribed ? `Active: ${(currentUser as any).chosen_plan || 'Premium Member'}` : 'Upgrade to watch all content'}
                </Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </Pressable>

            {/* 2. Downloads Section */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 4,
              }}
              onPress={() => navigation.navigate('VideoGrid', { section: 'downloads' })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#181926',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
              >
                <Download size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
                  Downloads
                </Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>
                  {downloadedVideoList.length} Downloads
                </Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </Pressable>

            {/* 3. Saved Videos */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 4,
              }}
              onPress={() => navigation.navigate('VideoGrid', { section: 'saved' })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#181926',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
              >
                <Bookmark size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
                  Saved Videos
                </Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>
                  {savedVideos.length} bookmarked videos
                </Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </Pressable>

            {/* 4. Liked Videos */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 4,
              }}
              onPress={() => navigation.navigate('VideoGrid', { section: 'liked' })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#181926',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
              >
                <Heart size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
                  Liked Videos
                </Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>
                  {likedVideos.length} liked videos
                </Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </Pressable>

            {/* 5. Logout */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 4,
              }}
              onPress={userIsLoggedIn ? handleLogout : () => navigation.navigate('Login')}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#181926',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
              >
                {userIsLoggedIn ? <LogOut size={20} color="#EF4444" /> : <LogIn size={20} color="#6366F1" />}
              </View>
              <Text
                style={{
                  flex: 1,
                  color: userIsLoggedIn ? '#EF4444' : '#6366F1',
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                {userIsLoggedIn ? 'Logout' : 'Log In'}
              </Text>
              <ChevronRight size={18} color="#475569" />
            </Pressable>
          </View>
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
