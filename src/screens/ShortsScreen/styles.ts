import { Dimensions, StyleSheet } from 'react-native';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  shortCard: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    backgroundColor: '#05050A',
    position: 'relative',
  },
  playerStyle: {
    ...StyleSheet.absoluteFill,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  },
  touchableOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topHeaderBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Right-hand overlay buttons (clean line-icon style matching YouTube Shorts / Image 2)
  rightSidebar: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    alignItems: 'center',
    gap: 15,
    zIndex: 15,
  },
  actionButton: {
    alignItems: 'center',
    minWidth: 44,
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom text overlay (clean positioning right above bottom bar matching Image 2)
  bottomInfoContainer: {
    position: 'absolute',
    left: 14,
    right: 76,
    bottom: 14,
    zIndex: 15,
  },
  shortTitleText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Scrubber Progress Bar sitting right on bottom edge touching bottom nav bar
  scrubberContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    justifyContent: 'flex-end',
    zIndex: 16,
  },
  scrubberTrack: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    width: '100%',
    position: 'relative',
  },
  scrubberTrackActive: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  scrubberProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  scrubberProgressActive: {
    backgroundColor: '#FF0000',
  },
  scrubIndicatorPill: {
    position: 'absolute',
    bottom: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  scrubIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Hold to 2X Speed Floating Indicator
  speedPillIndicator: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 30,
  },
  speedPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 3,
  },

  // Dynamic Highlight / Karaoke Subtitles Overlay
  shortsSubtitleOverlay: {
    position: 'absolute',
    left: 18,
    right: 68,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 14,
  },
  shortsSubtitleBox: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
    maxWidth: '92%',
  },
  shortsSubtitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '700',
  },

  // Network Fallback & Empty Card
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Shimmer Skeleton Screen
  skeletonContainer: {
    flex: 1,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    backgroundColor: '#0A0A12',
    justifyContent: 'flex-end',
    paddingBottom: 90,
  },
  skeletonSidebar: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    gap: 18,
    alignItems: 'center',
  },
  skeletonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E1E2C',
  },
  skeletonTextLine: {
    height: 10,
    width: 26,
    borderRadius: 4,
    backgroundColor: '#1A1A24',
    marginTop: 4,
  },
  skeletonBottomContent: {
    position: 'absolute',
    left: 16,
    bottom: 90,
    right: 76,
    gap: 8,
  },
  skeletonTitleLine1: {
    height: 14,
    width: '78%',
    borderRadius: 6,
    backgroundColor: '#1E1E2C',
  },
  skeletonTitleLine2: {
    height: 12,
    width: '52%',
    borderRadius: 6,
    backgroundColor: '#161622',
  },
});
