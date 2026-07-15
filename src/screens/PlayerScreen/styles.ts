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
        backgroundColor: colors.background,
        justifyContent: 'center',
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
    },
    playerInfo: {
        padding: 16,
    },
    playerTitle: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '900',
    },
    playerDescription: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '500',
        marginTop: 8,
        lineHeight: 18,
    },
});