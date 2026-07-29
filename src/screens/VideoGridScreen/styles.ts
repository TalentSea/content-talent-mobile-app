import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    expandedHeader: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonSpacer: {
        width: 36,
    },
    backIcon: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '900',
        marginTop: -2,
    },
    expandedTitle: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '900',
    },
    gridContent: {
        paddingHorizontal: 14,
        paddingBottom: 24,
    },
    gridRow: {
        justifyContent: 'space-between',
    },
    emptyText: {
        color: colors.text,
        fontSize: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
});