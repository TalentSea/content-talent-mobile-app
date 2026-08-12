import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
    playerScreen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    playerVideoArea: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000000',
        justifyContent: 'center',
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
    },
    playerInfoScroll: {
        flex: 1,
    },
    playerInfoContent: {
        padding: 16,
        paddingBottom: 40,
    },
    playerTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
    },
    playerDescription: {
        color: colors.muted,
        fontSize: 13,
        fontWeight: '400',
        marginTop: 8,
        lineHeight: 18,
    },
    actionsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginVertical: 18,
        paddingVertical: 12,
        backgroundColor: '#12121C',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1E1E2D',
    },
    actionBtn: {
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        color: '#D1D5DB',
        fontSize: 11,
        fontWeight: '600',
    },
});