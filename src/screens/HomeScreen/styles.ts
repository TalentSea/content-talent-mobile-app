import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  horizontalContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  verticalContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cardType1: {
    width: 220,
  },
  cardType2: {
    width: '100%',
  },
  thumbnailWrapper: {
    width: '100%',
    height: 124,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#272727',
  },
  thumbnailWrapperLarge: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#272727',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cardMetaContainer: {
    marginTop: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 18,
  },
  cardTitleLarge: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  cardMeta: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 4,
  },
});