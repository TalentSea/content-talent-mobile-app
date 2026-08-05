import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  playerContainer: {
    width: width,
    height: (width * 9) / 16, // 16:9 Aspect Ratio
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButtonOverlay: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 3,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  metaSection: {
    marginTop: 14,
    marginBottom: 16,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  metaSubtext: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 6,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#272727',
    marginBottom: 16,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconText: {
    fontSize: 18,
    marginBottom: 4,
  },
  actionLabel: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '500',
  },
  commentsPreviewBox: {
    backgroundColor: '#1F1F1F',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commentsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  commentsCount: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  commentSnippet: {
    color: '#DDDDDD',
    fontSize: 13,
  },
  relatedHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});