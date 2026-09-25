import { StyleSheet } from 'react-native';

export const createStyles = (theme: any) => StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.mainBackgroundColor,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
    },

    // ── Hero Brand Header ──
    heroSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    iconGradientLayer1: {
        ...StyleSheet.absoluteFill,
        backgroundColor: theme.primaryColor, // Indigo
        borderRadius: 20,
    },
    iconGradientLayer2: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#EC4899', // Pink
        borderRadius: 20,
        opacity: 0.7,
        top: '30%',
        left: '30%',
        right: '-30%',
        bottom: '-30%',
    },
    iconInner: {
        zIndex: 1,
        paddingLeft: 3,
    },
    brandTitle: {
        color: theme.primaryTextColor,
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    brandSubtitle: {
        color: theme.mutedTextColor,
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },

    // ── Card Container ──
    card: {
        backgroundColor: '#12121E',
        borderRadius: 20,
        paddingHorizontal: 22,
        paddingTop: 28,
        paddingBottom: 26,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 8,
    },

    // ── Header Row ──
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 23,
        fontWeight: '800',
        color: theme.primaryTextColor,
        letterSpacing: -0.2,
    },
    headerLinkRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLinkText: {
        fontSize: 12.5,
        color: theme.mutedTextColor,
    },
    headerLinkAction: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#818CF8',
    },

    // ── Inputs Container ──
    inputsContainer: {
        gap: 12,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 14.5,
        color: theme.primaryTextColor,
        backgroundColor: '#0B0B13',
    },
    inputFocused: {
        borderColor: theme.primaryColor,
        backgroundColor: '#0E0E1A',
    },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    inputHalf: {
        flex: 1,
    },

    // ── Options Row (Login: Remember me & Forgot Password) ──
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 18,
    },
    forgotPasswordText: {
        fontSize: 13,
        color: '#818CF8',
        fontWeight: '600',
    },

    // ── Terms & Conditions Checkbox Row (Register) ──
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 18,
    },
    checkbox: {
        width: 19,
        height: 19,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: '#0B0B13',
    },
    checkboxChecked: {
        backgroundColor: theme.primaryColor,
        borderColor: theme.primaryColor,
    },
    checkboxLabel: {
        fontSize: 12.5,
        color: theme.mutedTextColor,
        flexShrink: 1,
    },
    checkboxLink: {
        color: '#818CF8',
        fontWeight: '600',
    },

    // ── Primary Action Button (Indigo/Blue) ──
    primaryButton: {
        backgroundColor: theme.primaryColor,
        borderRadius: 10,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 4,
    },
    primaryButtonPressed: {
        backgroundColor: theme.activeStateColor,
        opacity: 0.9,
    },
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: theme.primaryTextColor,
        fontSize: 15.5,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // ── Divider ──
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        paddingHorizontal: 12,
        fontSize: 12.5,
        color: '#6B7280',
        fontWeight: '500',
    },

    // ── Social Buttons Row ──
    socialRow: {
        flexDirection: 'row',
        gap: 12,
    },
    googleButton: {
        flex: 1,
        height: 44,
        borderWidth: 1.2,
        borderColor: 'rgba(234, 67, 53, 0.45)',
        borderRadius: 10,
        backgroundColor: 'rgba(234, 67, 53, 0.08)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    googleButtonPressed: {
        backgroundColor: 'rgba(234, 67, 53, 0.18)',
    },
    googleGPlusText: {
        color: '#FF6B6B',
        fontSize: 14.5,
        fontWeight: '800',
        marginRight: 6,
    },
    googleButtonText: {
        color: '#FF6B6B',
        fontSize: 13.5,
        fontWeight: '700',
    },

    facebookButton: {
        flex: 1,
        height: 44,
        borderWidth: 1.2,
        borderColor: 'rgba(24, 119, 242, 0.45)',
        borderRadius: 10,
        backgroundColor: 'rgba(24, 119, 242, 0.08)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    facebookButtonPressed: {
        backgroundColor: 'rgba(24, 119, 242, 0.18)',
    },
    facebookSquareBadge: {
        width: 18,
        height: 18,
        borderRadius: 4,
        backgroundColor: '#1877F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    facebookBadgeText: {
        color: theme.primaryTextColor,
        fontSize: 12.5,
        fontWeight: '800',
        lineHeight: 14,
    },
    facebookButtonText: {
        color: '#60A5FA',
        fontSize: 13.5,
        fontWeight: '700',
    },

    // ── Skip / Guest Link ──
    guestSkipButton: {
        marginTop: 22,
        alignSelf: 'center',
        padding: 8,
    },
    guestSkipText: {
        color: theme.mutedTextColor,
        fontSize: 13,
        fontWeight: '600',
    },

    // ── OTP & Verification Card ──
    otpSubtitle: {
        color: '#94A3B8',
        fontSize: 13.5,
        lineHeight: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    otpInput: {
        height: 56,
        backgroundColor: '#0A0A14',
        borderWidth: 1.5,
        borderColor: theme.activeStateColor,
        borderRadius: 14,
        paddingHorizontal: 16,
        color: theme.primaryTextColor,
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: 10,
        textAlign: 'center',
        marginBottom: 20,
    },
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    resendText: {
        color: '#64748B',
        fontSize: 13,
    },
    resendLink: {
        color: theme.primaryColor,
        fontSize: 13,
        fontWeight: '700',
    },
    resendLinkDisabled: {
        color: '#475569',
    },
    backButtonRow: {
        marginTop: 14,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
    },

    // ── Modal Styles ──
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: '#12121E',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        color: theme.primaryTextColor,
        fontSize: 19,
        fontWeight: '800',
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalSubtitle: {
        color: '#94A3B8',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 18,
    },

    // ── Dedicated Social Login Card Styles ──
    socialCardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.primaryTextColor,
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    socialCardSubtitle: {
        fontSize: 13.5,
        color: '#94A3B8',
        textAlign: 'center',
    },
    fullSocialButtonGoogle: {
        backgroundColor: theme.primaryTextColor,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    fullSocialButtonFacebook: {
        backgroundColor: '#1877F2',
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        shadowColor: '#1877F2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    fullSocialButtonPressed: {
        opacity: 0.88,
        transform: [{ scale: 0.99 }],
    },
    fullSocialButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIconCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.primaryTextColor,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    googleIconLetter: {
        color: '#EA4335',
        fontSize: 18,
        fontWeight: '900',
    },
    fullSocialButtonGoogleText: {
        color: '#1F2937',
        fontSize: 15.5,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    facebookIconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.primaryTextColor,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    facebookIconLetter: {
        color: '#1877F2',
        fontSize: 17,
        fontWeight: '900',
        marginTop: -1,
    },
    fullSocialButtonFacebookText: {
        color: theme.primaryTextColor,
        fontSize: 15.5,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    socialTermsText: {
        color: '#64748B',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 6,
        paddingHorizontal: 8,
    },
    socialTermsLink: {
        color: '#818CF8',
        fontWeight: '600',
    },
});

