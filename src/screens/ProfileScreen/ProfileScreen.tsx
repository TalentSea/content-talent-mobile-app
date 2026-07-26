import React from 'react';
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
import { ChevronLeft, LogOut, CheckCircle, AlertCircle } from 'lucide-react-native';
import { styles } from './styles';
import { colors } from '../../constants/colors';

export function ProfileScreen({ navigation }: any) {
    const { user, clearSession, isLoading } = useAuth0();

    const handleLogout = async () => {
        try {
            await clearSession();
        } catch (error) {
            console.warn('Logout failed:', error);
        }
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.loadingScreen}>
                <ActivityIndicator color={colors.primary} size="large" />
            </SafeAreaView>
        );
    }

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

            {/* Profile Content */}
            <View style={styles.content}>
                <View style={styles.avatarContainer}>
                    {user.picture ? (
                        <Image source={{ uri: user.picture }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarFallbackText}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Name</Text>
                        <Text style={styles.infoValue}>{user.name || 'Anonymous User'}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user.email || 'N/A'}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <View style={styles.badgeRow}>
                            {user.email_verified ? (
                                <View style={[styles.badge, styles.badgeVerified]}>
                                    <CheckCircle color="#10B981" size={14} style={styles.badgeIcon} />
                                    <Text style={styles.badgeTextVerified}>Verified</Text>
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

                {/* Logout Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.logoutButton,
                        pressed && styles.logoutButtonPressed,
                    ]}
                    onPress={handleLogout}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <LogOut color="#FFFFFF" size={20} style={styles.logoutIcon} />
                            <Text style={styles.logoutButtonText}>Log Out</Text>
                        </>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
