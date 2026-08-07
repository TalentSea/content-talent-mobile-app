import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    appTitle: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '900',
    },
    refreshText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '800',
    },
    loadingWrap: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    loadingText: {
        color: colors.muted,
        marginTop: 8,
        fontSize: 12,
    },
    errorText: {
        color: colors.error,
        paddingHorizontal: 14,
        marginBottom: 10,
        fontSize: 12,
        fontWeight: '700',
    },
    playerLoading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        marginLeft: 12,
        padding: 4,
    },
    profileButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginLeft: 12,
    },
    avatarMini: {
        width: 34,
        height: 34,
        borderRadius: 17,
    },
    playlistsRowContainer: {
        marginVertical: 14,
    },
    playlistsRowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 12,
    },
    playlistsRowTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    seeAllButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    seeAllText: {
        color: '#818CF8',
        fontSize: 13,
        fontWeight: '600',
    },
    playlistsListContent: {
        paddingHorizontal: 4,
        gap: 12,
    },
    playlistCard: {
        width: 180,
        height: 100,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#181824',
        marginRight: 12,
    },
    playlistCardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    playlistCardOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        padding: 10,
        justifyContent: 'flex-end',
    },
    playlistCardTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    playlistCardMeta: {
        color: '#9CA3AF',
        fontSize: 10,
        fontWeight: '600',
    },
});