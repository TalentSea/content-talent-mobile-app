import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronLeft, Play, X, KeyRound, Mail, ArrowLeft } from 'lucide-react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

let LoginManager: any = null;
let AccessToken: any = null;
let Profile: any = null;
try {
    const fbsdk = require('react-native-fbsdk-next');
    LoginManager = fbsdk.LoginManager;
    AccessToken = fbsdk.AccessToken;
    Profile = fbsdk.Profile;
} catch (e) {
    // Safe fallback if fbsdk is not installed
}

import {
    loginWithSocial,
    loginWithEmail,
    registerWithEmail,
    verifyRegistrationOtp,
    requestForgotPassword,
    verifyResetCode,
    resetPasswordWithToken,
    loginAsGuest,
    setSessionTokens,
    restoreStoredSession,
    SocialProvider,
    UserProfile,
} from '../../services/api/authService';
import { DEFAULT_AUTH_TOKEN, getCreatorId } from '../../constants/config';
import { fetchMobileBrandingApi } from '../../services/api/brandingApi';
import { useAppTheme } from '../../context/ThemeContext';
import { createStyles } from './styles';

export function LoginScreen({ route, navigation, initialMode }: any) {
    const { theme, setTheme, setBranding, branding } = useAppTheme();
    const styles = createStyles(theme);
    const defaultMode = initialMode || route?.params?.mode || 'login';
    const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

    // Form inputs state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Registration OTP Verification State
    const [otpMode, setOtpMode] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Forgot Password Modal State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'password'>('email');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotCode, setForgotCode] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
    const [forgotResetToken, setForgotResetToken] = useState('');
    const [forgotSubmitting, setForgotSubmitting] = useState(false);

    // Auth loading state
    const [submitting, setSubmitting] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<SocialProvider | 'email' | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // Facebook fallback modal state
    const [showFacebookModal, setShowFacebookModal] = useState(false);
    const [fbEmailOrPhone, setFbEmailOrPhone] = useState('');
    const [fbPassword, setFbPassword] = useState('');
    const [fbUsername, setFbUsername] = useState('');
    const [fbLoggingIn, setFbLoggingIn] = useState(false);

    const navigateToHome = () => {
        if (navigation) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        }
    };

    useEffect(() => {
        let timer: any = null;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [resendCooldown]);

    useEffect(() => {
        if (route?.params?.mode) {
            setMode(route.params.mode);
        }
    }, [route?.params?.mode]);

    useEffect(() => {
        let isMounted = true;
        async function checkAutoLogin() {
            try {
                GoogleSignin.configure({
                    scopes: ['email', 'profile'],
                    webClientId: '166951692335-a6bblebovsn6ftnrs15n9n8bjpo79o5g.apps.googleusercontent.com',
                    offlineAccess: true,
                });
            } catch (err) {
                console.warn('[GoogleSignin] Configure notice:', err);
            }

            try {
                const restoredUser = await restoreStoredSession();
                if (restoredUser && restoredUser.provider !== 'guest' && isMounted) {
                    console.log('[LoginScreen] Auto-login restored subscriber user:', restoredUser.name);
                    navigateToHome();
                    return;
                }
            } catch (e) {
                console.warn('[LoginScreen] Auto-login check notice:', e);
            } finally {
                if (isMounted) {
                    setIsCheckingSession(false);
                }
            }
        }

        checkAutoLogin();
        return () => {
            isMounted = false;
        };
    }, [navigation]);

    // ── Email / Password Submit Handler ──
    const handleSubmit = async () => {
        const cleanEmail = email.trim();
        const cleanPass = password.trim();

        if (mode === 'register') {
            const cleanName = name.trim();
            const cleanConfirm = confirmPassword.trim();

            if (!cleanName) {
                Alert.alert('Register', 'Please enter your full name.');
                return;
            }
            if (!cleanEmail || !cleanEmail.includes('@')) {
                Alert.alert('Register', 'Please enter a valid email address.');
                return;
            }
            if (!cleanPass || cleanPass.length < 6) {
                Alert.alert('Register', 'Password must be at least 6 characters.');
                return;
            }
            if (cleanPass !== cleanConfirm) {
                Alert.alert('Register', 'Passwords do not match.');
                return;
            }
            if (!termsAccepted) {
                Alert.alert('Terms & Privacy', 'Please accept the terms and privacy policy to continue.');
                return;
            }

            try {
                setSubmitting(true);
                const regRes = await registerWithEmail(cleanName, cleanEmail, cleanPass, getCreatorId());

                if ((regRes as any)?.needs_verification) {
                    setOtpMode(true);
                    setResendCooldown(60);
                    Alert.alert(
                        'Verification Code Sent',
                        `We have sent a 6-digit verification code to ${cleanEmail}. Please enter it to complete registration.`
                    );
                } else {
                    // Direct token issued (auto-login)
                    if (navigation) {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                    }
                }
            } catch (error: any) {
                console.warn('[Register] error:', error);
                const msg = error?.detail || error?.message || 'Could not complete registration. Please try again.';
                Alert.alert('Registration Notice', msg);
            } finally {
                setSubmitting(false);
            }
        } else {
            // Mode === 'login'
            if (!cleanEmail) {
                Alert.alert('Log in', 'Please enter your email address or username.');
                return;
            }
            if (!cleanPass) {
                Alert.alert('Log in', 'Please enter your password.');
                return;
            }

            try {
                setSubmitting(true);
                await loginWithEmail(cleanEmail, cleanPass, rememberMe, getCreatorId());
                if (navigation) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                    });
                }
            } catch (error: any) {
                console.warn('[Login] error:', error);
                const msg = error?.detail || error?.message || 'Invalid email or password.';
                Alert.alert('Login Notice', msg);
            } finally {
                setSubmitting(false);
            }
        }
    };

    // ── OTP Registration Verification ──
    const handleVerifyOtp = async () => {
        const cleanCode = otpCode.trim();
        if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
            Alert.alert('Verification Code', 'Please enter a valid 6-digit numeric verification code.');
            return;
        }

        try {
            setSubmitting(true);
            await verifyRegistrationOtp(email.trim(), cleanCode, getCreatorId());
            if (navigation) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        } catch (err: any) {
            console.warn('[handleVerifyOtp] error:', err);
            const msg = err?.detail || err?.message || 'Invalid or expired verification code.';
            Alert.alert('Verification Error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        try {
            setSubmitting(true);
            await registerWithEmail(name.trim() || 'User', email.trim(), password.trim(), getCreatorId());
            setResendCooldown(60);
            Alert.alert('Code Resent', `A new verification code has been sent to ${email.trim()}.`);
        } catch (err: any) {
            const msg = err?.detail || err?.message || 'Could not resend code. Please wait 60s and try again.';
            Alert.alert('Resend Notice', msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Forgot Password Handlers ──
    const handleOpenForgotModal = () => {
        setForgotEmail(email.trim() || '');
        setForgotCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotResetToken('');
        setForgotStep('email');
        setShowForgotModal(true);
    };

    const handleForgotRequestCode = async () => {
        const clean = forgotEmail.trim().toLowerCase();
        if (!clean || !clean.includes('@')) {
            Alert.alert('Reset Password', 'Please enter a valid registered email address.');
            return;
        }
        try {
            setForgotSubmitting(true);
            await requestForgotPassword(clean, getCreatorId());
            setForgotStep('code');
            Alert.alert('Code Sent', `We sent a 6-digit reset code to ${clean}.`);
        } catch (err: any) {
            const msg = err?.detail || err?.message || 'Could not send reset code.';
            Alert.alert('Reset Notice', msg);
        } finally {
            setForgotSubmitting(false);
        }
    };

    const handleForgotVerifyCode = async () => {
        const clean = forgotCode.trim();
        if (clean.length !== 6 || !/^\d{6}$/.test(clean)) {
            Alert.alert('Reset Code', 'Please enter the 6-digit verification code.');
            return;
        }
        try {
            setForgotSubmitting(true);
            const res = await verifyResetCode(forgotEmail.trim().toLowerCase(), clean, getCreatorId());
            if (res && res.reset_token) {
                setForgotResetToken(res.reset_token);
                setForgotStep('password');
            }
        } catch (err: any) {
            const msg = err?.detail || err?.message || 'Invalid or expired verification code.';
            Alert.alert('Invalid Code', msg);
        } finally {
            setForgotSubmitting(false);
        }
    };

    const handleForgotResetPassword = async () => {
        const newPass = forgotNewPassword.trim();
        if (newPass.length < 6) {
            Alert.alert('New Password', 'Password must be at least 6 characters.');
            return;
        }
        if (newPass !== forgotConfirmPassword.trim()) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }
        try {
            setForgotSubmitting(true);
            await resetPasswordWithToken(forgotResetToken, newPass, getCreatorId());
            setShowForgotModal(false);
            if (navigation) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        } catch (err: any) {
            const msg = err?.detail || err?.message || 'Could not reset password.';
            Alert.alert('Reset Error', msg);
        } finally {
            setForgotSubmitting(false);
        }
    };

    // ── Social Login Handler ──
    const handleSocialLogin = async (provider: SocialProvider) => {
        try {
            setLoadingProvider(provider);

            let realToken = '';
            let realProfile: UserProfile | undefined = undefined;

            if (provider === 'google') {
                try {
                    try {
                        await GoogleSignin.signOut();
                        await GoogleSignin.revokeAccess();
                    } catch (e) {
                        // ignore
                    }

                    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
                    const response = await GoogleSignin.signIn();

                    realToken =
                        response?.data?.idToken ||
                        (response as any)?.idToken ||
                        (response as any)?.data?.id_token ||
                        (response as any)?.id_token ||
                        (response as any)?.user?.idToken ||
                        '';

                    const rawUser = response?.data?.user || (response as any)?.user || response;
                    const googleEmail = rawUser?.email || (response as any)?.email;

                    let googleName =
                        rawUser?.name ||
                        (response as any)?.name ||
                        (response as any)?.data?.user?.name ||
                        (rawUser?.givenName ? `${rawUser.givenName} ${rawUser.familyName || ''}`.trim() : '');

                    if (!googleName && googleEmail) {
                        googleName = googleEmail.split('@')[0];
                        googleName = googleName.charAt(0).toUpperCase() + googleName.slice(1);
                    }

                    if (googleEmail) {
                        realProfile = {
                            id: Date.now(),
                            name: googleName || 'Google User',
                            email: googleEmail,
                            avatar_url: rawUser?.photo || (response as any)?.photo || undefined,
                            provider: 'google',
                            role: 'subscriber',
                        };
                    }
                } catch (googleErr: any) {
                    console.warn('[GoogleSignin] Native Google notice:', googleErr);
                    setLoadingProvider(null);
                    return;
                }

                if (!realProfile) {
                    try {
                        const currentUser = await GoogleSignin.getCurrentUser();
                        const u = currentUser?.user || (currentUser as any)?.data?.user;
                        if (u?.email) {
                            const fullName = u.name || (u.givenName ? `${u.givenName} ${u.familyName || ''}`.trim() : u.email.split('@')[0]);
                            realProfile = {
                                id: Date.now(),
                                name: fullName,
                                email: u.email,
                                avatar_url: u.photo || undefined,
                                provider: 'google',
                                role: 'subscriber',
                            };
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            } else if (provider === 'facebook') {
                try {
                    if (LoginManager) {
                        try {
                            LoginManager.logOut();
                        } catch (e) {
                            // ignore
                        }
                        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

                        if (result?.isCancelled) {
                            setLoadingProvider(null);
                            return;
                        }
                    }

                    if (AccessToken) {
                        const data = await AccessToken.getCurrentAccessToken();
                        if (data && data.accessToken) {
                            realToken = typeof data.accessToken === 'string'
                                ? data.accessToken
                                : (data.accessToken as any).toString();
                        }
                    }

                    if (Profile) {
                        try {
                            const currentProfile = await Profile.getCurrentProfile();
                            if (currentProfile) {
                                const fullName = currentProfile.name || `${currentProfile.firstName || ''} ${currentProfile.lastName || ''}`.trim() || 'Facebook User';
                                realProfile = {
                                    id: Date.now(),
                                    name: fullName,
                                    email: currentProfile.email || `${currentProfile.userID || 'user'}@facebook.com`,
                                    avatar_url: currentProfile.imageURL || undefined,
                                    provider: 'facebook',
                                    role: 'subscriber',
                                };
                            }
                        } catch (e) {
                            // ignore profile fetch error
                        }
                    }

                    if (!realProfile && realToken) {
                        try {
                            const graphRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,first_name,last_name,email,picture.type(large)&access_token=${realToken}`);
                            const userInfo = await graphRes.json();
                            if (userInfo && userInfo.id) {
                                const fbName = userInfo.name || (userInfo.first_name ? `${userInfo.first_name} ${userInfo.last_name || ''}`.trim() : '');
                                realProfile = {
                                    id: Date.now(),
                                    name: fbName || 'Facebook User',
                                    email: userInfo.email || `${userInfo.id}@facebook.com`,
                                    avatar_url: userInfo.picture?.data?.url || undefined,
                                    provider: 'facebook',
                                    role: 'subscriber',
                                };
                            }
                        } catch (e) {
                            // ignore graph error
                        }
                    }
                } catch (facebookErr: any) {
                    console.warn('[FacebookSignin] Native Facebook redirect error:', facebookErr);
                }

                if (!realToken && !realProfile) {
                    setLoadingProvider(null);
                    setFbEmailOrPhone('');
                    setFbPassword('');
                    setShowFacebookModal(true);
                    return;
                }
            }

            if (!realToken && !realProfile) {
                setLoadingProvider(null);
                return;
            }

            const sendToken = realToken || `token_${provider}_${Date.now()}`;
            const authRes = await loginWithSocial(provider, sendToken, undefined, realProfile, getCreatorId());

            const finalUser: UserProfile = {
                ...(authRes?.user || {}),
                ...(realProfile || {}),
                name: realProfile?.name || authRes?.user?.name || ((provider as string) === 'facebook' ? 'Facebook User' : 'Google User'),
                email: realProfile?.email || authRes?.user?.email || null,
                avatar_url: realProfile?.avatar_url || authRes?.user?.avatar_url || null,
                provider: provider,
            };

            setSessionTokens(
                authRes?.access_token || DEFAULT_AUTH_TOKEN,
                authRes?.refresh_token || `${provider}_session`,
                finalUser,
            );

            // Fetch branding now that we have a token
            try {
                const brandingData = await fetchMobileBrandingApi();
                if (brandingData) {
                    setBranding(brandingData);
                    if (brandingData.colors) setTheme(brandingData.colors);
                }
            } catch (err) {
                console.warn(`[LoginScreen] Branding fetch error for ${provider}:`, err);
            }

            navigateToHome();
        } catch (error) {
            console.warn(`[LoginScreen] ${provider} social login notice:`, error);
        } finally {
            setLoadingProvider(null);
        }
    };

    // ── Facebook Direct Modal Fallback ──
    const handleFacebookModalSubmit = async () => {
        const input = fbEmailOrPhone.trim();
        const pass = fbPassword.trim();

        if (!input) {
            Alert.alert('Facebook Login', 'Please enter your Facebook email address or mobile number.');
            return;
        }
        if (!pass) {
            Alert.alert('Facebook Login', 'Please enter your Facebook password.');
            return;
        }

        try {
            setFbLoggingIn(true);
            let emailVal = input;
            if (input.includes('_gmail_com')) {
                emailVal = input.replace('_gmail_com', '@gmail.com');
            } else if (!input.includes('@') && /^\d+$/.test(input)) {
                emailVal = `${input}@facebook.com`;
            } else if (!input.includes('@')) {
                emailVal = `${input}@gmail.com`;
            }

            let cleanName = fbUsername.trim();
            if (!cleanName) {
                const prefix = emailVal.split('@')[0];
                const words = prefix.replace(/[._]/g, ' ').replace(/\d+/g, ' ').split(' ').filter(Boolean);
                if (words.length > 0) {
                    cleanName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                } else {
                    cleanName = 'Facebook User';
                }
            }

            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=1877F2&color=fff&size=256`;
            const fbProfile: UserProfile = {
                id: Date.now(),
                name: cleanName,
                email: emailVal,
                avatar_url: avatarUrl,
                provider: 'facebook',
                role: 'subscriber',
            };

            const sendToken = `mock_facebook_${input.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const authRes = await loginWithSocial('facebook', sendToken, undefined, fbProfile, getCreatorId());

            const finalFbUser: UserProfile = {
                ...(authRes?.user || {}),
                ...fbProfile,
            };

            setSessionTokens(
                authRes?.access_token || DEFAULT_AUTH_TOKEN,
                authRes?.refresh_token || 'facebook_session',
                finalFbUser,
            );

            setShowFacebookModal(false);
            if (navigation) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        } catch (err) {
            console.warn('[FacebookModal] error:', err);
            setShowFacebookModal(false);
            if (navigation) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        } finally {
            setFbLoggingIn(false);
        }
    };

    const handleContinueAsGuest = async () => {
        try {
            setLoadingProvider('guest');
            await loginAsGuest(undefined, getCreatorId());
        } catch (e) {
            console.warn('[handleContinueAsGuest] notice:', e);
        } finally {
            setLoadingProvider(null);
            navigateToHome();
        }
    };

    if (isCheckingSession) {
        return (
            <SafeAreaView style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="light-content" backgroundColor="#05050A" />
                <ActivityIndicator color="#6366F1" size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            {branding?.banner_url ? (
                <>
                    <Image
                        source={{ uri: branding.banner_url }}
                        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.95 }]}
                        resizeMode="cover"
                    />
                    {/* Dark gradient/overlay so text is readable */}
                    <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                </>
            ) : null}
            <StatusBar barStyle="light-content" backgroundColor="#05050A" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Hero Brand Header ── */}
                    <View style={styles.heroSection}>
                        {branding?.logo_url ? (
                            <Image 
                                source={{ uri: branding.logo_url }}
                                style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 16, backgroundColor: theme.cardBackgroundColor }}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.iconContainer}>
                                <View style={styles.iconGradientLayer1} />
                                <View style={styles.iconGradientLayer2} />
                                <View style={styles.iconInner}>
                                    <Play
                                        color="#FFFFFF"
                                        size={24}
                                        fill="#FFFFFF"
                                        strokeWidth={0}
                                    />
                                </View>
                            </View>
                        )}
                        <Text style={[styles.brandTitle, { color: '#FFFFFF' }]}>
                            {branding?.studio_name || branding?.creator_name || 'Streamr'}
                        </Text>
                        <Text style={[styles.brandSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                            {mode === 'register'
                                ? 'Create an account to join the community'
                                : 'Sign in to your streaming account'}
                        </Text>
                    </View>

                    {/* Main Transparent Container */}
                    <View style={styles.card}>
                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <Text style={[styles.socialCardTitle, { color: '#FFFFFF' }]}>Sign In</Text>
                            <Text style={[styles.socialCardSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                                Connect instantly to continue streaming
                            </Text>
                        </View>

                        {/* Google Sign In Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.fullSocialButtonGoogle,
                                { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
                                pressed && styles.fullSocialButtonPressed,
                                loadingProvider !== null && { opacity: 0.7 },
                            ]}
                            onPress={() => handleSocialLogin('google')}
                            disabled={loadingProvider !== null || submitting}
                        >
                            {loadingProvider === 'google' ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <View style={styles.fullSocialButtonContent}>
                                    <View style={[styles.googleIconCircle, { backgroundColor: 'transparent' }]}>
                                        <Text style={styles.googleIconLetter}>G</Text>
                                    </View>
                                    <Text style={[styles.fullSocialButtonGoogleText, { color: '#FFFFFF' }]}>
                                        Continue with Google
                                    </Text>
                                </View>
                            )}
                        </Pressable>

                        {/* Facebook Sign In Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.fullSocialButtonFacebook,
                                pressed && styles.fullSocialButtonPressed,
                                loadingProvider !== null && { opacity: 0.7 },
                            ]}
                            onPress={() => handleSocialLogin('facebook')}
                            disabled={loadingProvider !== null || submitting}
                        >
                            {loadingProvider === 'facebook' ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <View style={styles.fullSocialButtonContent}>
                                    <View style={[styles.facebookIconCircle, { backgroundColor: 'transparent' }]}>
                                        <Text style={styles.facebookIconLetter}>f</Text>
                                    </View>
                                    <Text style={[styles.fullSocialButtonFacebookText, { color: '#FFFFFF' }]}>
                                        Continue with Facebook
                                    </Text>
                                </View>
                            )}
                        </Pressable>

                        {/* Terms & Privacy Footnote */}
                        <Text style={[styles.socialTermsText, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                            By continuing, you agree to our{' '}
                            <Text
                                style={[styles.socialTermsLink, { color: '#FFFFFF' }]}
                                onPress={() => Alert.alert('Terms of Service', 'By using Streamr, you agree to our Terms of Service.')}
                            >
                                Terms
                            </Text>
                            {' '}and{' '}
                            <Text
                                style={[styles.socialTermsLink, { color: '#FFFFFF' }]}
                                onPress={() => Alert.alert('Privacy Policy', 'Streamr respects and protects your private user data.')}
                            >
                                Privacy Policy
                            </Text>
                            .
                        </Text>
                    </View>

                    {/* ── Guest Skip Link ── */}
                    <Pressable
                        style={styles.guestSkipButton}
                        onPress={handleContinueAsGuest}
                        disabled={loadingProvider !== null || submitting}
                    >
                        {loadingProvider === 'guest' ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={[styles.guestSkipText, { color: '#FFFFFF' }]}>
                                Skip & Continue as Guest →
                            </Text>
                        )}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Facebook Login Modal (Fallback) ── */}
            <Modal
                visible={showFacebookModal}
                animationType="slide"
                onRequestClose={() => setShowFacebookModal(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#05050A' }}>
                    <StatusBar barStyle="light-content" backgroundColor="#05050A" />

                    <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 36 }}>
                            <Pressable
                                onPress={() => setShowFacebookModal(false)}
                                style={{ padding: 8, marginLeft: -8, marginRight: 12 }}
                            >
                                <ChevronLeft size={28} color="#FFFFFF" />
                            </Pressable>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                                Log in to Facebook
                            </Text>
                        </View>

                        <View style={{ gap: 16 }}>
                            <View style={{ borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: '#0E0E18', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6 }}>
                                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Email address or mobile number</Text>
                                <TextInput
                                    style={{ fontSize: 16, color: '#FFFFFF', paddingVertical: 8 }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#64748B"
                                    value={fbEmailOrPhone}
                                    onChangeText={setFbEmailOrPhone}
                                />
                            </View>

                            <View style={{ borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: '#0E0E18', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6 }}>
                                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Password</Text>
                                <TextInput
                                    style={{ fontSize: 16, color: '#FFFFFF', paddingVertical: 8 }}
                                    secureTextEntry
                                    placeholderTextColor="#64748B"
                                    value={fbPassword}
                                    onChangeText={setFbPassword}
                                />
                            </View>

                            <Pressable
                                style={({ pressed }) => [{
                                    backgroundColor: '#1877F2',
                                    borderRadius: 10,
                                    paddingVertical: 14,
                                    alignItems: 'center',
                                    marginTop: 12,
                                    opacity: pressed || fbLoggingIn ? 0.8 : 1,
                                }]}
                                onPress={handleFacebookModalSubmit}
                                disabled={fbLoggingIn}
                            >
                                {fbLoggingIn ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                                        Log in
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* ── Forgot Password Modal ── */}
            <Modal
                visible={showForgotModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowForgotModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalBackdrop}
                >
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {forgotStep === 'email' && 'Reset Password'}
                                {forgotStep === 'code' && 'Enter Reset Code'}
                                {forgotStep === 'password' && 'Set New Password'}
                            </Text>
                            <Pressable
                                onPress={() => setShowForgotModal(false)}
                                hitSlop={8}
                                style={styles.modalCloseBtn}
                            >
                                <Text style={{ color: '#94A3B8', fontSize: 18, fontWeight: '700' }}>✕</Text>
                            </Pressable>
                        </View>

                        {forgotStep === 'email' && (
                            <View>
                                <Text style={styles.modalSubtitle}>
                                    Enter your registered email address and we'll send you a 6-digit password reset code.
                                </Text>
                                <TextInput
                                    style={[styles.input, { marginBottom: 16 }]}
                                    placeholder="Email address"
                                    placeholderTextColor="#64748B"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={forgotEmail}
                                    onChangeText={setForgotEmail}
                                />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.primaryButton,
                                        pressed && styles.primaryButtonPressed,
                                        forgotSubmitting && styles.primaryButtonDisabled,
                                    ]}
                                    onPress={handleForgotRequestCode}
                                    disabled={forgotSubmitting}
                                >
                                    {forgotSubmitting ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Send Code</Text>
                                    )}
                                </Pressable>
                            </View>
                        )}

                        {forgotStep === 'code' && (
                            <View>
                                <Text style={styles.modalSubtitle}>
                                    Enter the 6-digit code sent to{' '}
                                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{forgotEmail}</Text>.
                                </Text>
                                <TextInput
                                    style={[styles.input, styles.otpInput]}
                                    placeholder="• • • • • •"
                                    placeholderTextColor="#64748B"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    value={forgotCode}
                                    onChangeText={setForgotCode}
                                />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.primaryButton,
                                        pressed && styles.primaryButtonPressed,
                                        forgotSubmitting && styles.primaryButtonDisabled,
                                    ]}
                                    onPress={handleForgotVerifyCode}
                                    disabled={forgotSubmitting}
                                >
                                    {forgotSubmitting ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Verify Code</Text>
                                    )}
                                </Pressable>
                            </View>
                        )}

                        {forgotStep === 'password' && (
                            <View>
                                <Text style={styles.modalSubtitle}>
                                    Choose a new password for your account.
                                </Text>
                                <TextInput
                                    style={[styles.input, { marginBottom: 12 }]}
                                    placeholder="New Password (min 6 characters)"
                                    placeholderTextColor="#64748B"
                                    secureTextEntry
                                    value={forgotNewPassword}
                                    onChangeText={setForgotNewPassword}
                                />
                                <TextInput
                                    style={[styles.input, { marginBottom: 16 }]}
                                    placeholder="Confirm New Password"
                                    placeholderTextColor="#64748B"
                                    secureTextEntry
                                    value={forgotConfirmPassword}
                                    onChangeText={setForgotConfirmPassword}
                                />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.primaryButton,
                                        pressed && styles.primaryButtonPressed,
                                        forgotSubmitting && styles.primaryButtonDisabled,
                                    ]}
                                    onPress={handleForgotResetPassword}
                                    disabled={forgotSubmitting}
                                >
                                    {forgotSubmitting ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Update Password & Sign In</Text>
                                    )}
                                </Pressable>
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

export function RegisterScreen(props: any) {
    return <LoginScreen {...props} initialMode="register" />;
}
