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
        marginRight: 16,
        paddingVertical: 6,
        paddingHorizontal: 10,
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
    },
    avatarMini: {
        width: 34,
        height: 34,
        borderRadius: 17,
    },
});