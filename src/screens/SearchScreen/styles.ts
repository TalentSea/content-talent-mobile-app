import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: -2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161622',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 8,
    marginLeft: 8,
  },
  recentWrap: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recentTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#1C1C2B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D2D42',
  },
  tagText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  filterBar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    maxHeight: 52,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#2A2A3C',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
