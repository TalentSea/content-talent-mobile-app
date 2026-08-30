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
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
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
  const [showDownloads, setShowDownloads] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuthChange(() => {
      setUser(getCurrentUser());
    });
    return unsub;
  }, []);

  const { videos, loading, reload } = useVideos();
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
    ? currentUser.chosen_plan
      ? `${currentUser.chosen_plan} Member`
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
                  {userIsSubscribed ? `Active: ${currentUser.chosen_plan || 'Premium Member'}` : 'Upgrade to watch all content'}
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
              onPress={() => setShowDownloads(prev => !prev)}
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
                  {downloadedVideoList.length} saved offline videos
                </Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </Pressable>

            {/* 3. Settings */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 4,
              }}
              onPress={() => navigation?.navigate('Settings')}
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
                <Settings size={20} color="#A1A1AA" />
              </View>
              <Text style={{ flex: 1, color: '#F1F5F9', fontSize: 15, fontWeight: '600' }}>
                Settings
              </Text>
              <ChevronRight size={18} color="#475569" />
            </Pressable>

            {/* 4. Help & Support */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 4,
              }}
              onPress={handleSupportPress}
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
                <HelpCircle size={20} color="#F59E0B" />
              </View>
              <Text style={{ flex: 1, color: '#F1F5F9', fontSize: 15, fontWeight: '600' }}>
                Help & Support
              </Text>
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

          {/* Downloads Grid Section */}
          {showDownloads && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                Saved Offline Downloads ({downloadedVideoList.length})
              </Text>
              <VerticalList
                videos={downloadedVideoList}
                numColumns={2}
                refreshing={loading}
                isContinueWatching={true}
                onRefresh={reload}
                onPressVideo={playVideo}
                emptyText="No saved offline downloads yet."
              />
            </View>
          )}
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
