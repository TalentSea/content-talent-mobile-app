import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 90,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    width: '48%',
    height: 175,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#0D1117',
  },
  cardBackgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 15, 28, 0.65)',
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardMetaText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginBottom: 10,
  },
  skeletonBarLong: {
    width: '85%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 6,
  },
  skeletonBarShort: {
    width: '60%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  previewBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 'auto',
  },
  previewBox: {
    flex: 1,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});

