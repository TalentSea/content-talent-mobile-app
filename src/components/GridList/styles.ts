import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    // Dynamically calculate column width (total width - padding - gap) / 2
    width: (width - 32 - 12) / 2, 
  },
  thumbnailWrapper: {
    width: '100%',
    height: 110,
    borderRadius: 8,
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
  metaContainer: {
    marginTop: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 3,
  },
});