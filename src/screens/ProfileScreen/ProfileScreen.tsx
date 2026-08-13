import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, LogOut, LogIn, CheckCircle, User as UserIcon, Settings, Bell } from 'lucide-react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useUserActivity } from '../../hooks/useUserActivity';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { useDownloads } from '../../hooks/useDownloads';
import { getCurrentUser, clearSessionTokens } from '../../services/api/authService';
import type { DownloadedVideoItem } from '../../services/downloadService';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';
import { colors } from '../../constants/colors';

export function ProfileScreen({ navigation }: any) {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState<'liked' | 'saved' | 'downloads' | 'history'>('liked');

  const { videos, loading, reload } = useVideos();
  const { likedVideos, savedVideos } = useUserActivity();
  const { continueWatching } = useWatchHistory();
  const { downloadedVideos } = useDownloads();
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);

  const isLoggedIn = !!user;

  const currentUser = user || {
    name: 'User',
    email: 'user@streamr.app',
    avatar_url: undefined,
    role: 'guest',
  };

  const userVideos: ApiVideo[] =
    activeTab === 'history'
      ? continueWatching
      : activeTab === 'liked'
      ? likedVideos
      : activeTab === 'saved'
      ? savedVideos
      : downloadedVideos.map((item: DownloadedVideoItem) => item.video);

  const handleLogout = async () => {
    await clearSessionTokens();
    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const handleLoginRedirect = () => {
    if (navigation) {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header: Clean title with back, notifications, and settings buttons */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={colors.text} size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Account Profile</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => navigation.navigate('Notifications')}>
            <Bell color="#FFFFFF" size={20} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Settings')}>
            <Settings color="#FFFFFF" size={20} />
          </Pressable>
        </View>
      </View>


      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          {currentUser.avatar_url ? (
            <Image source={{ uri: currentUser.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <UserIcon color="#FFFFFF" size={32} />
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{currentUser.name}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{currentUser.email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, isLoggedIn ? styles.badgeVerified : { backgroundColor: 'rgba(107, 114, 128, 0.2)' }]}>
                <CheckCircle color={isLoggedIn ? '#10B981' : '#9CA3AF'} size={14} style={styles.badgeIcon} />
                <Text style={isLoggedIn ? styles.badgeTextVerified : { color: '#9CA3AF', fontSize: 12, fontWeight: '600' }}>
                  {isLoggedIn ? `Verified ${currentUser.role}` : 'Guest Visitor'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Login or Logout Action Button */}
        <View style={{ marginTop: 12, marginBottom: 6, width: '100%' }}>
          {isLoggedIn ? (
            <Pressable
              style={({ pressed }) => [{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderColor: '#EF4444',
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.8 : 1,
              }]}
              onPress={handleLogout}
            >
              <LogOut color="#EF4444" size={18} />
              <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 14 }}>
                Log Out
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [{
                backgroundColor: '#6366F1',
                borderRadius: 12,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.8 : 1,
              }]}
              onPress={handleLoginRedirect}
            >
              <LogIn color="#FFFFFF" size={18} />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                Log In with Google or Facebook
              </Text>
            </Pressable>
          )}
        </View>

        {/* User Activity Tab Switcher: Liked | Saved | Downloads | History */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[
              styles.tabButton,
              activeTab === 'liked' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('liked')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'liked' && styles.activeTabText,
              ]}
              numberOfLines={1}
            >
              Liked ({likedVideos.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabButton,
              activeTab === 'saved' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('saved')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'saved' && styles.activeTabText,
              ]}
              numberOfLines={1}
            >
              Saved ({savedVideos.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabButton,
              activeTab === 'downloads' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('downloads')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'downloads' && styles.activeTabText,
              ]}
              numberOfLines={1}
            >
              Downloads ({downloadedVideos.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabButton,
              activeTab === 'history' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.activeTabText,
              ]}
              numberOfLines={1}
            >
              History ({continueWatching.length})
            </Text>
          </Pressable>
        </View>

        {/* Activity Feed Grid */}
        <View style={{ flex: 1 }}>
          <VerticalList
            videos={userVideos}
            numColumns={2}
            refreshing={loading}
            isContinueWatching={true}
            onRefresh={reload}
            onPressVideo={playVideo}
            emptyText={`No ${activeTab} videos found.`}
          />
        </View>
      </View>

      {/* Permanent Bottom Navigation Bar */}
      <BottomNavBar activeTab="Profile" navigation={navigation} />

      {/* Video Player Modal */}
      <PlayerModal playingVideo={playingVideo} onClose={closePlayer} />
    </SafeAreaView>
  );
}
