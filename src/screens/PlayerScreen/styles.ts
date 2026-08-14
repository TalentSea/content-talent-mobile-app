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
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  playerInfoScroll: {
    flex: 1,
  },
  playerInfoContent: {
    padding: 16,
    paddingBottom: 40,
  },
  playerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 8,
    gap: 6,
  },
  playerCategoryBadge: {
    backgroundColor: '#3730A3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  playerCategoryBadgeText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '700',
  },
  playerMetaDot: {
    color: '#6B7280',
    fontSize: 10,
  },
  playerMetaText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  playerDescription: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    marginTop: 4,
  },
  showMoreBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#12121C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E2D',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
  fullscreenContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
});