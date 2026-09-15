import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    expandedHeader: {
        paddingHorizontal: 14,
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
        fontSize: 16,
        fontWeight: '900',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161622',
        marginHorizontal: 14,
        marginVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#2A2A3C',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 13,
        paddingVertical: 10,
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