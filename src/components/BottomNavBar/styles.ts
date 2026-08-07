import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0F0F1A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
  },
  tabText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#6366F1',
    fontWeight: '700',
  },
});
