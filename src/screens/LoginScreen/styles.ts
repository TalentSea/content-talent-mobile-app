import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0A0A12',
    },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        justifyContent: 'center',
    },

    // ── Hero Section ──
    heroSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    iconContainer: {
        width: 88,
        height: 88,
        borderRadius: 24,
        marginBottom: 28,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    // Two layered views to simulate the purple-to-pink gradient
    iconGradientLayer1: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#7B2FF2',  // Purple
        borderRadius: 24,
    },
    iconGradientLayer2: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#C850C0',  // Pink
        borderRadius: 24,
        opacity: 0.7,
        // Shift to bottom-right to create gradient effect
        top: '30%',
        left: '30%',
        right: '-30%',
        bottom: '-30%',
    },
    iconInner: {
        zIndex: 1,
        // Slight offset to center the play icon visually
        paddingLeft: 4,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 0.3,
        marginBottom: 8,
    },
    subtitle: {
        color: '#7A7A8E',
        fontSize: 15,
        fontWeight: '500',
    },

    // ── Buttons Section ──
    buttonsSection: {
        gap: 14,
    },
    socialButton: {
        backgroundColor: '#16161F',
        borderRadius: 16,
        height: 58,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    socialButtonPressed: {
        opacity: 0.75,
        transform: [{ scale: 0.985 }],
    },
    socialButtonDisabled: {
        opacity: 0.5,
    },
    socialButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    socialButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 14,
    },

    // ── Google Icon ──
    googleIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleIconText: {
        color: '#4285F4',
        fontSize: 17,
        fontWeight: '700',
    },

    // ── Facebook Icon ──
    facebookIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1877F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    facebookIconText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
