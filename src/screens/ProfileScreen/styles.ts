import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background || '#05050A',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161622',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // New Top Profile Card (Gradient Avatar, Name, Email, Membership Role)
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141420',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
    marginBottom: 14,
  },
  avatarGradientBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 18,
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
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
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
    marginTop: 5,
  },
  membershipText: {
    color: '#A855F7',
    fontSize: 13,
    fontWeight: '700',
  },
  cardChevron: {
    marginLeft: 8,
  },

  // Tab Switcher Styles (Liked | Saved | Downloads | History)
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141422',
    borderRadius: 10,
    padding: 4,
    marginVertical: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: colors.primary || '#6366F1',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Edit Profile Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#12121E',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  avatarPickerSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  previewAvatarWrapper: {
    width: 76,
    height: 76,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#6366F1',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    marginBottom: 12,
  },
  previewAvatarImg: {
    width: 76,
    height: 76,
  },
  avatarPickerLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  curatedAvatarsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 14,
  },
  curatedAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  curatedAvatarBtnSelected: {
    borderColor: '#6366F1',
    transform: [{ scale: 1.08 }],
  },
  curatedAvatarImg: {
    width: '100%',
    height: '100%',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#0A0A14',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnPressed: {
    backgroundColor: '#4F46E5',
    opacity: 0.9,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

