import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#181818',
  },
  thumbnailWrapper: {
    width: '100%',
    height: 195,
    backgroundColor: '#121212',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  emptyThumbnailBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#141414',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#222222',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E50914',
  },
  detailsContainer: {
    padding: 12,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  emptyTitleLine: {
    width: '75%',
    height: 14,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    marginBottom: 8,
  },
  emptyMetaLine: {
    width: '35%',
    height: 10,
    backgroundColor: '#141414',
    borderRadius: 4,
  },
});