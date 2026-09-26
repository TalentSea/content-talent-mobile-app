import { StyleSheet } from 'react-native';
import type { ThemeColors } from '../../context/ThemeContext';

export const createStyles = (theme: ThemeColors) => StyleSheet.create({
  playerScreen: {
    flex: 1,
    backgroundColor: theme.mainBackgroundColor,
  },
  playerVideoArea: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 215,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignSelf: 'center',
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  playerTitle: {
    color: theme.primaryTextColor,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 6,
    gap: 6,
  },
  playerCategoryBadge: {
    backgroundColor: theme.activeStateColor ? `${theme.activeStateColor}33` : '#3730A3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  playerCategoryBadgeText: {
    color: theme.activeStateColor || theme.primaryColor,
    fontSize: 11,
    fontWeight: '700',
  },
  playerMetaDot: {
    color: theme.mutedTextColor,
    fontSize: 10,
  },
  playerMetaText: {
    color: theme.secondaryTextColor,
    fontSize: 12,
    fontWeight: '500',
  },
  playerDescription: {
    color: theme.secondaryTextColor,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
  },
  showMoreBtn: {
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    color: theme.primaryColor,
    fontSize: 12,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 10,
    paddingVertical: 8,
    backgroundColor: theme.cardBackgroundColor,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: theme.primaryTextColor,
    fontSize: 11,
    fontWeight: '600',
  },
  fullscreenContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
});