import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
    loadingScreen: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
    },
    headerPlaceholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    avatarFallback: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    avatarFallbackText: {
        color: colors.text,
        fontSize: 28,
        fontWeight: '800',
    },
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        color: colors.muted,
        fontSize: 13,
        fontWeight: '500',
    },
    infoValue: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeVerified: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    badgePending: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    badgeIcon: {
        marginRight: 4,
    },
    badgeTextVerified: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '600',
    },
    badgeTextPending: {
        color: '#F59E0B',
        fontSize: 12,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141422',
        borderRadius: 10,
        padding: 4,
        marginBottom: 14,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTabButton: {
        backgroundColor: colors.primary || '#6366F1',
    },
    tabText: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    logoutButton: {
        backgroundColor: colors.primary,
        borderRadius: 14,
        height: 48,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    logoutButtonPressed: {
        opacity: 0.85,
    },
    logoutIcon: {
        marginRight: 8,
    },
    logoutButtonText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '700',
    },
});
