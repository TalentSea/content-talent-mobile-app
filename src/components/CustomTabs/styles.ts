import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#272727', // Dark gray for inactive pills
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabPill: {
    backgroundColor: '#FFFFFF', // High-contrast white for active pill
  },
  tabText: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#0F0F0F', // Dark text on active white pill
    fontWeight: '700',
  },
});