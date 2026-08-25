import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, LogOut, LogIn, CheckCircle, User as UserIcon, Settings, Bell, Trash2 } from 'lucide-react-native';
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
  const { likedVideos, savedVideos } = useUserActivity(videos);
  const { continueWatching, history, removeWatchHistoryItem, clearWatchHistory } = useWatchHistory(videos);
  const { downloadedVideos } = useDownloads(videos);
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);

  const isLoggedIn = !!user;

  const currentUser = user || {
    name: 'User',
    email: 'user@streamr.app',
    avatar_url: undefined,
    role: 'guest',
  };

  const historyVideos: ApiVideo[] = history.map(h => h.video);

  const userVideos: ApiVideo[] =
    activeTab === 'history'
      ? historyVideos
      : activeTab === 'liked'
        ? likedVideos
        : activeTab === 'saved'
          ? savedVideos
          : downloadedVideos
            .map((item: DownloadedVideoItem) => item?.video || (item as any))
            .filter((v: ApiVideo) => v && v.id);

  const handleLogout = async () => {
    await clearSessionTokens();
    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const handleLoginRedirect = async () => {
    await clearSessionTokens();
    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header: Circular back button, Profile title, Notifications and Settings circular icon buttons */}
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

      <View style={styles.content}>
        {/* Upper Profile Section matching screenshot */}
        <View style={styles.profileHeaderSection}>
          <View style={styles.avatarRing}>
            {currentUser.avatar_url ? (
              <Image source={{ uri: currentUser.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarInner}>
                <UserIcon color="#FFFFFF" size={36} />
              </View>
            )}
          </View>

          {currentUser.provider === 'guest' || currentUser.role === 'guest' ? (
            <Text style={styles.profileNameText}>Guest User</Text>
          ) : (
            <>
              <Text style={styles.profileNameText}>
                {currentUser.name || 'Streamr Subscriber'}
              </Text>

              {currentUser.email ? (
                <Text style={styles.profileEmailText}>{currentUser.email}</Text>
              ) : null}

              <View style={styles.verifiedBadgePill}>
                <CheckCircle color="#10B981" size={14} />
                <Text style={styles.verifiedBadgeText}>
                  {currentUser.provider === 'google'
                    ? 'Google Subscriber'
                    : currentUser.provider === 'facebook'
                    ? 'Facebook Subscriber'
                    : 'Verified Subscriber'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Login or Logout Action Button */}
        <View style={{ marginTop: 12, marginBottom: 6, width: '100%' }}>
          {currentUser.provider === 'guest' || currentUser.role === 'guest' ? (
            <Pressable
              style={({ pressed }) => [{
                backgroundColor: '#6366F1',
                borderRadius: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.8 : 1,
              }]}
              onPress={handleLoginRedirect}
            >
              <LogIn color="#FFFFFF" size={18} />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                Log In
              </Text>
            </Pressable>
          ) : (
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
              History ({history.length})
            </Text>
          </Pressable>
        </View>

        {/* Clear All History Header Action Button */}
        {activeTab === 'history' && history.length > 0 ? (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Pressable
              style={({ pressed }) => [{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
                opacity: pressed ? 0.8 : 1,
              }]}
              onPress={() => clearWatchHistory()}
            >
              <Trash2 size={12} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Clear All History</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Activity Feed Grid */}
        <View style={{ flex: 1 }}>
          <VerticalList
            videos={userVideos}
            numColumns={2}
            refreshing={loading}
            isContinueWatching={true}
            onRefresh={reload}
            onPressVideo={playVideo}
            onDeleteVideo={activeTab === 'history' ? (video: any) => removeWatchHistoryItem(video.id) : undefined}
            emptyText={`No ${activeTab} videos found.`}
          />
        </View>
      </View>

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
