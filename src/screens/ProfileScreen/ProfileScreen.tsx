import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Bookmark,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Download,
  Edit2,
  Heart,
  HelpCircle,
  LogIn,
  LogOut,
  Settings,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { useDownloads } from '../../hooks/useDownloads';
import { useUserActivity } from '../../hooks/useUserActivity';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import {
  clearSessionTokens,
  getCurrentUser,
  getUserSubscriptionTier,
  isUserLoggedIn,
  isUserSubscribed,
  isUserAdFree,
  subscribeAuthChange,
  updateSubscriberProfile,
  uploadSubscriberProfilePhoto,
} from '../../services/api/authService';
import { fetchUserSubscriptionStatus, LiveSubscriptionDTO } from '../../services/api/subscriptionApi';
import type { DownloadedVideoItem } from '../../services/downloadService';
import type { ApiVideo } from '../../types/video';
import { styles } from './styles';

const CURATED_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&h=256&fit=crop&crop=faces',
];

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
  const [activeSection, setActiveSection] = useState<'history' | 'downloads' | 'saved' | 'liked' | null>('history');
  const [liveSub, setLiveSub] = useState<LiveSubscriptionDTO | null>(null);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const unsub = subscribeAuthChange(() => {
      setUser(getCurrentUser());
    });
    return unsub;
  }, []);

  useEffect(() => {
    async function loadBackendSubscription() {
      try {
        const status = await fetchUserSubscriptionStatus();
        if (status && status.subscription) {
          setLiveSub(status.subscription);
        } else {
          setLiveSub({ plan_name: 'Free Plan', status: 'Free' });
        }
      } catch (e) {
        console.warn('[ProfileScreen] Error fetching subscription from API:', e);
      } finally {
        setUser(getCurrentUser());
      }
    }
    loadBackendSubscription();
  }, []);

  const { videos, loading, reload } = useVideos();
  const { downloadedVideos } = useDownloads(videos);
  const { savedVideos, likedVideos } = useUserActivity(videos);
  const { history, removeWatchHistoryItem, clearWatchHistory } = useWatchHistory(videos);
  const { playingVideo, playVideo, closePlayer } = useVideoPlayback(videos);

  const handleDeleteHistoryItem = (video: ApiVideo) => {
    Alert.alert(
      'Remove Video',
      `Remove "${video.title}" from your watch history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeWatchHistoryItem(video.id),
        },
      ],
    );
  };

  const userIsLoggedIn = isUserLoggedIn();
  const userIsSubscribed = Boolean(liveSub?.plan_name && liveSub.plan_name !== 'Free Plan') || isUserSubscribed();
  const subTier = getUserSubscriptionTier();
  const userAdFree = isUserAdFree();

  const activePlanName = liveSub?.plan_name || (userIsSubscribed ? (subTier === 'premium' ? 'Premium Plan' : 'Basic Plan') : 'Free Plan');
  const daysRemainingStr = liveSub?.days_remaining ? ` (${liveSub.days_remaining} days left)` : '';

  const currentUser = user
    ? {
      ...user,
      name:
        (user.name === 'Guest User' || !user.name) && userIsSubscribed
          ? 'VIP Subscriber'
          : user.name,
      role: userIsSubscribed ? (subTier === 'premium' ? 'premium' : 'subscriber') : user.role,
      chosen_plan: activePlanName,
      plan_id: user.plan_id || (userIsSubscribed ? (subTier === 'premium' ? 'premium' : 'basic') : null),
    }
    : {
      name: userIsSubscribed ? 'VIP Subscriber' : 'Guest Visitor',
      email: userIsSubscribed
        ? 'vip@streamr.app'
        : 'Sign in to access your profile',
      avatar_url: undefined,
      role: userIsSubscribed ? (subTier === 'premium' ? 'premium' : 'subscriber') : 'guest',
      chosen_plan: activePlanName,
      plan_id: userIsSubscribed ? (subTier === 'premium' ? 'premium' : 'basic') : null,
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
    ? subTier === 'premium'
      ? 'PREMIUM SUBSCRIBER'
      : 'VIP SUBSCRIBER'
    : 'FREE MEMBER';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#05050A" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={reload}
            tintColor="#FFFFFF"
          />
        }
      >
        {/* Profile Card Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Account</Text>
        </View>

        <View style={styles.content}>
          <Pressable
            style={styles.userCard}
            onPress={() => {
              if (!userIsLoggedIn) {
                navigation?.navigate('Login');
              } else {
                setEditName(currentUser.name || '');
                setEditPhotoUrl(currentUser.avatar_url || '');
                setShowEditModal(true);
              }
            }}
          >
            <View style={styles.avatarGradientBox}>
              {currentUser.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(currentUser.name)}</Text>
              )}
              {userIsLoggedIn && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    backgroundColor: '#6366F1',
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#12121E',
                  }}
                >
                  <Edit2 size={10} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.userInfoContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userNameText}>{currentUser.name}</Text>
                {userIsLoggedIn && <Edit2 size={13} color="#818CF8" />}
              </View>
              <Text style={styles.userEmailText}>{currentUser.email || 'guest@streamr.app'}</Text>
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
              onPress={async () => {
                try {
                  const status = await fetchUserSubscriptionStatus();
                  if (status.subscription) {
                    setLiveSub(status.subscription);
                  }
                } catch (e) {
                  // ignore
                }
                navigation?.navigate('Subscription');
              }}
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
                <Crown size={20} color={userIsSubscribed ? '#A855F7' : '#94A3B8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
                  My Subscription
                </Text>
                <Text style={{ color: userIsSubscribed ? '#A855F7' : '#64748B', fontSize: 12, marginTop: 1, fontWeight: userIsSubscribed ? '600' : '400' }}>
                  Current plan: {activePlanName}{daysRemainingStr}
                </Text>
                <Text style={{ color: userAdFree ? '#10B981' : '#94A3B8', fontSize: 11, marginTop: 1 }}>
                  {userAdFree ? '✨ Ad-Free Playback Active' : '📺 Ad-Supported Viewing'}
                </Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </Pressable>

            {/* 2. Watch History Section */}
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 4,
              }}
              onPress={() => setActiveSection(prev => (prev === 'history' ? null : 'history'))}
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
                <Clock size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700' }}>
                  Watch History
                </Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>
                  {history.length} watched videos in progress
                </Text>
              </View>
              <ChevronRight
                size={18}
                color="#475569"
                style={activeSection === 'history' ? { transform: [{ rotate: '90deg' }] } : undefined}
              />
            </Pressable>

            {/* 3. Downloads Section */}
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

            {/* 4. Saved Videos */}
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

            {/* 5. Liked Videos */}
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

            {/* 6. Logout */}
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

          {/* Expandable Section Display */}
          {activeSection === 'history' && (
            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  Watch History
                </Text>
                {history.length > 0 && (
                  <Pressable
                    onPress={() => {
                      Alert.alert('Clear Watch History', 'Are you sure you want to clear your watch history?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Clear All', style: 'destructive', onPress: () => clearWatchHistory() },
                      ]);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Trash2 size={14} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Clear All</Text>
                  </Pressable>
                )}
              </View>
              <VerticalList
                videos={history.map(item => item.video)}
                numColumns={2}
                scrollable={false}
                refreshing={loading}
                isContinueWatching={true}
                onRefresh={reload}
                onPressVideo={playVideo}
                onDeleteVideo={handleDeleteHistoryItem}
                emptyText="No watch history recorded yet. Start watching videos to track progress!"
              />
            </View>
          )}

          {/* Expandable Section Display */}
          {activeSection === 'downloads' && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                Saved Offline Downloads ({downloadedVideoList.length})
              </Text>
              <VerticalList
                videos={downloadedVideoList}
                numColumns={2}
                scrollable={false}
                refreshing={loading}
                isContinueWatching={true}
                onRefresh={reload}
                onPressVideo={playVideo}
                emptyText="No saved offline downloads yet."
              />
            </View>
          )}

          {activeSection === 'saved' && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                Saved Videos ({savedVideos.length})
              </Text>
              <VerticalList
                videos={savedVideos}
                numColumns={2}
                refreshing={loading}
                isContinueWatching={true}
                onRefresh={reload}
                onPressVideo={playVideo}
                emptyText="No saved videos yet."
              />
            </View>
          )}

          {activeSection === 'liked' && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                Liked Videos ({likedVideos.length})
              </Text>
              <VerticalList
                videos={likedVideos}
                numColumns={2}
                refreshing={loading}
                isContinueWatching={true}
                onRefresh={reload}
                onPressVideo={playVideo}
                emptyText="No liked videos yet."
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

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable
                onPress={() => setShowEditModal(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Avatar Preview & Selection */}
            <View style={styles.avatarPickerSection}>
              <View style={styles.previewAvatarWrapper}>
                {editPhotoUrl ? (
                  <Image source={{ uri: editPhotoUrl }} style={styles.previewAvatarImg} />
                ) : (
                  <Text style={styles.avatarInitials}>{getInitials(editName || currentUser.name)}</Text>
                )}
              </View>

              <Text style={styles.avatarPickerLabel}>Choose Profile Picture</Text>
              <View style={styles.curatedAvatarsRow}>
                {CURATED_AVATARS.map((url, idx) => {
                  const isSelected = editPhotoUrl === url;
                  return (
                    <Pressable
                      key={idx}
                      style={[
                        styles.curatedAvatarBtn,
                        isSelected && styles.curatedAvatarBtnSelected,
                      ]}
                      onPress={() => setEditPhotoUrl(url)}
                    >
                      <Image source={{ uri: url }} style={styles.curatedAvatarImg} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Custom Photo URL or File URI */}
            <Text style={styles.inputLabel}>Custom Photo URL / File URI</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://... or file:///..."
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              value={editPhotoUrl}
              onChangeText={setEditPhotoUrl}
            />

            {/* Display Name Input */}
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Your full name"
              placeholderTextColor="#64748B"
              value={editName}
              onChangeText={setEditName}
              autoCapitalize="words"
            />

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && styles.saveBtnPressed,
                savingProfile && styles.saveBtnDisabled,
              ]}
              onPress={async () => {
                const cleanName = editName.trim();
                if (!cleanName) {
                  Alert.alert('Edit Profile', 'Please enter a valid display name.');
                  return;
                }

                try {
                  setSavingProfile(true);

                  // 1. Update Name if modified (PATCH /api/v1/mobile/auth/profile)
                  if (cleanName !== currentUser.name) {
                    await updateSubscriberProfile(cleanName);
                  }

                  // 2. Upload / Update Photo if modified (POST /api/v1/mobile/auth/profile/photo)
                  if (editPhotoUrl && editPhotoUrl !== currentUser.avatar_url) {
                    await uploadSubscriberProfilePhoto(editPhotoUrl);
                  }

                  setShowEditModal(false);
                  setUser(getCurrentUser());
                  Alert.alert('Profile Saved', 'Your profile details have been updated.');
                } catch (err: any) {
                  console.warn('[EditProfile] Save error:', err);
                  const msg = err?.detail || err?.message || 'Could not update profile.';
                  Alert.alert('Update Notice', msg);
                } finally {
                  setSavingProfile(false);
                }
              }}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
