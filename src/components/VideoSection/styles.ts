import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
    section: {
        marginTop: 12,
    },
    sectionHeader: {
        paddingHorizontal: 14,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '900',
    },
    seeAll: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: '800',
    },
    row: {
        paddingLeft: 14,
        paddingRight: 8,
    },
    emptyText: {
        color: colors.text,
        fontSize: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
});