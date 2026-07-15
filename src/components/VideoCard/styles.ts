import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
    card: {
        width: 132,
        marginRight: 12,
    },
    cardFullWidth: {
        width: '48%',
        marginRight: 0,
        marginBottom: 18,
    },
    thumbnailWrap: {
        width: '100%',
        height: 82,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: colors.surface,
    },
    thumbnailWrapFullWidth: {
        height: 110,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    playBadge: {
        position: 'absolute',
        top: 7,
        right: 7,
        width: 23,
        height: 23,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: colors.text,
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 1,
    },
    statusBadge: {
        position: 'absolute',
        left: 7,
        bottom: 7,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusText: {
        color: colors.text,
        fontSize: 8,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    videoTitle: {
        color: colors.text,
        fontSize: 10,
        fontWeight: '900',
        marginTop: 7,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
    },
    category: {
        color: colors.primary,
        fontSize: 8,
        fontWeight: '900',
        maxWidth: 54,
    },
    dot: {
        color: '#777',
        fontSize: 8,
        marginHorizontal: 3,
    },
    meta: {
        color: colors.muted,
        fontSize: 8,
        fontWeight: '600',
        maxWidth: 65,
    },
});