import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', // Side-by-side layout for vertical lists
    marginBottom: 16,
  },
  thumbnailContainer: {
    width: 140,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E1E',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 18,
  },
  metaText: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 4,
  },
});