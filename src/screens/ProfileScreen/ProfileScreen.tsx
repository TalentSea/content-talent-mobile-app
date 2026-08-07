import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    StatusBar,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth0 } from 'react-native-auth0';
import { ChevronLeft, LogOut, CheckCircle, AlertCircle, User as UserIcon } from 'lucide-react-native';
import { BottomNavBar } from '../../components/BottomNavBar';
import { VerticalList } from '../../components/VerticalList';
import { PlayerModal } from '../PlayerScreen/PlayerModal';
import { useVideos } from '../../hooks/useVideo';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { styles } from './styles';
import { colors } from '../../constants/colors';

export function ProfileScreen({ navigation }: any) {
    const { user, clearSession, isLoading } = useAuth0();
    const [activeTab, setActiveTab] = useState<'liked' | 'saved' | 'favourited'>('liked');

    const { popularVideos, loading, reload } = useVideos();
    const { playingVideo, playVideo, closePlayer } = useVideoPlayback();

    const currentUser = user || {
        name: 'Streamr Creator',
        email: 'creator@streamr.app',
        picture: null,
        email_verified: true,
    };

    const userVideos =
        activeTab === 'liked'
            ? popularVideos.slice(0, 3)
            : activeTab === 'saved'
            ? popularVideos.slice(1, 4)
            : popularVideos.slice(2);

    const handleLogout = async () => {
        try {
            if (user) {
                await clearSession();
            } else {
                navigation.goBack();
            }
        } catch (error) {
            console.warn('Logout failed:', error);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color={colors.text} size={24} />
                </Pressable>
                <Text style={styles.headerTitle}>Account Profile</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    {currentUser.picture ? (
                        <Image source={{ uri: currentUser.picture }} style={styles.avatar} />
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
                            {currentUser.email_verified ? (
                                <View style={[styles.badge, styles.badgeVerified]}>
                                    <CheckCircle color="#10B981" size={14} style={styles.badgeIcon} />
                                    <Text style={styles.badgeTextVerified}>Verified Creator</Text>
                                </View>
                            ) : (
                                <View style={[styles.badge, styles.badgePending]}>
                                    <AlertCircle color="#F59E0B" size={14} style={styles.badgeIcon} />
                                    <Text style={styles.badgeTextPending}>Pending Verification</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* User Activity Tab Switcher: Liked | Saved | Favourited */}
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
                        >
                            Liked ({popularVideos.slice(0, 3).length})
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
                        >
                            Saved ({popularVideos.slice(1, 4).length})
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.tabButton,
                            activeTab === 'favourited' && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab('favourited')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'favourited' && styles.activeTabText,
                            ]}
                        >
                            Favourited ({popularVideos.slice(2).length})
                        </Text>
                    </Pressable>
                </View>

                {/* Activity Feed Grid (VL) */}
                <View style={{ flex: 1 }}>
                    <VerticalList
                        videos={userVideos}
                        numColumns={2}
                        refreshing={loading}
                        onRefresh={reload}
                        onPressVideo={playVideo}
                        emptyText={`No ${activeTab} videos yet.`}
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
