import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 280,
    marginBottom: 20,
    position: 'relative',
  },
  bannerSlide: {
    width: width - 32,
    marginHorizontal: 16,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },

  // Branding Badges (Pluralsight Path & Clip/Trailer)
  brandingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pluralsightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pluralsightBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 'auto',
  },
  categoryPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Creator Row
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  creatorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E1E2E',
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  creatorBio: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },

  // Studio Branding Card Content
  brandingHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  brandingLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E1E2E',
  },
  brandingTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  brandingTaglineText: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },

  // Video Title & Description
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },

  // Action Buttons (Watch Now & Clip/Trailer)
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  trailerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Pagination Dots
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
});
