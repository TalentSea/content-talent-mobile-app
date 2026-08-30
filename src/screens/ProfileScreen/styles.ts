import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A10',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  // Profile Header Card (Matching Screenshot)
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141420',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 20,
  },
  avatarGradientBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#C026D3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  userInfoContainer: {
    flex: 1,
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 24,
  },
  userEmailText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  membershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  membershipText: {
    color: '#A855F7',
    fontSize: 13,
    fontWeight: '700',
  },
  cardChevron: {
    marginLeft: 8,
  },

  // Menu List Items
  menuList: {
    gap: 4,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#181926',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemTitle: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
  menuItemChevron: {
    marginLeft: 8,
  },

  // Sub-Section for Selected Video List (History/Liked/Saved/Downloads)
  activeSectionContainer: {
    marginTop: 16,
    flex: 1,
  },
  activeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
