import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StatusBar,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, ChevronLeft } from 'lucide-react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { loginWithSocial, setSessionTokens, SocialProvider, UserProfile } from '../../services/api/authService';
import { DEFAULT_AUTH_TOKEN } from '../../constants/config';
import { styles } from './styles';

export function LoginScreen({ navigation }: any) {
    const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

    // Facebook Dedicated Login Modal State
    const [showFacebookModal, setShowFacebookModal] = useState(false);
    const [fbEmailOrPhone, setFbEmailOrPhone] = useState('');
    const [fbPassword, setFbPassword] = useState('');
    const [fbLoggingIn, setFbLoggingIn] = useState(false);

    useEffect(() => {
        try {
            GoogleSignin.configure({
                scopes: ['email', 'profile'],
                webClientId: '166951692335-a6bblebovsn6ftnrs15n9n8bjpo79o5g.apps.googleusercontent.com',
                offlineAccess: true,
            });
        } catch (err) {
            console.warn('[GoogleSignin] Configure notice:', err);
        }
    }, []);

    const handleSocialLogin = async (provider: SocialProvider) => {
        try {
            setLoadingProvider(provider);

            let realToken = '';
            let realProfile: UserProfile | undefined = undefined;

            if (provider === 'google') {
                try {
                    try {
                        await GoogleSignin.signOut();
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
                    if (rawUser?.email) {
                        realProfile = {
                            id: Date.now(),
                            name: rawUser.name || rawUser.givenName || rawUser.email.split('@')[0],
                            email: rawUser.email,
                            avatar_url: rawUser.photo || undefined,
                            provider: 'google',
                            role: 'subscriber',
                        };
                    }
                } catch (googleErr: any) {
                    console.warn('[GoogleSignin] Native Google error:', googleErr);
                    if (googleErr?.code === statusCodes.SIGN_IN_CANCELLED) {
                        setLoadingProvider(null);
                        return;
                    }
                }
            } else if (provider === 'facebook') {
                try {
                    const LoginManager = require('react-native-fbsdk-next')?.LoginManager;
                    const AccessToken = require('react-native-fbsdk-next')?.AccessToken;
                    const Profile = require('react-native-fbsdk-next')?.Profile;

                    if (LoginManager && AccessToken) {
                        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
                        if (!result.isCancelled) {
                            const data = await AccessToken.getCurrentAccessToken();
                            if (data?.accessToken) {
                                realToken = data.accessToken;

                                // 1. Try native FBSDK Profile
                                if (Profile) {
                                    try {
                                        const currentProfile = await Profile.getCurrentProfile();
                                        if (currentProfile?.name) {
                                            realProfile = {
                                                id: Date.now(),
                                                name: currentProfile.name,
                                                email: currentProfile.email || `${currentProfile.userID || 'user'}@facebook.com`,
                                                avatar_url: currentProfile.imageURL || undefined,
                                                provider: 'facebook',
                                                role: 'subscriber',
                                            };
                                        }
                                    } catch (pErr) {
                                        console.warn('[Profile.getCurrentProfile] notice:', pErr);
                                    }
                                }

                                // 2. Query Meta Graph API GET /me
                                if (!realProfile) {
                                    try {
                                        const graphRes = await fetch(
                                            `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${realToken}`
                                        );
                                        const fbData = await graphRes.json();
                                        if (fbData?.name) {
                                            realProfile = {
                                                id: Date.now(),
                                                name: fbData.name,
                                                email: fbData.email || `${fbData.id || 'user'}@facebook.com`,
                                                avatar_url: fbData.picture?.data?.url || undefined,
                                                provider: 'facebook',
                                                role: 'subscriber',
                                            };
                                        }
                                    } catch (graphErr) {
                                        console.warn('[Facebook Graph API] error:', graphErr);
                                    }
                                }
                            }
                        } else {
                            setLoadingProvider(null);
                            return;
                        }
                    }
                } catch (fbErr) {
                    console.warn('[FacebookLogin] Native SDK notice:', fbErr);
                }

                // If native SDK flow was bypassed, open dedicated input modal
                if (!realToken && !realProfile) {
                    setShowFacebookModal(true);
                    setLoadingProvider(null);
                    return;
                }
            }

            const sendToken = realToken || `mock_${provider}_${realProfile?.email || 'user'}`;
            const authRes = await loginWithSocial(provider, sendToken, 'Mobile App', realProfile);

            if (realProfile) {
                setSessionTokens(
                    authRes.access_token || DEFAULT_AUTH_TOKEN,
                    authRes.refresh_token || `${provider}_session`,
                    realProfile,
                );
            }

            if (navigation) {
                navigation.navigate('Home');
            }
        } catch (error) {
            console.warn(`[LoginScreen] ${provider} social login notice:`, error);
            if (navigation) {
                navigation.navigate('Home');
            }
        } finally {
            setLoadingProvider(null);
        }
    };

    const handleFacebookModalSubmit = async () => {
        const input = fbEmailOrPhone.trim();
        if (!input) return;

        try {
            setFbLoggingIn(true);

            let cleanName = input;
            if (input.includes('@')) {
                const prefix = input.split('@')[0];
                cleanName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            } else if (/^\d+$/.test(input)) {
                cleanName = `Facebook User ${input.slice(-4)}`;
            } else {
                cleanName = input;
            }

            const email = input.includes('@') ? input : `${input}@facebook.com`;

            const fbProfile: UserProfile = {
                id: Date.now(),
                name: cleanName,
                email: email,
                avatar_url: `https://via.placeholder.com/100x100/1877F2/FFFFFF?text=FB`,
                provider: 'facebook',
                role: 'subscriber',
            };

            const sendToken = `mock_facebook_${input.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const authRes = await loginWithSocial('facebook', sendToken, 'Mobile App', fbProfile);

            setSessionTokens(
                authRes.access_token || DEFAULT_AUTH_TOKEN,
                authRes.refresh_token || 'facebook_session',
                fbProfile,
            );

            setShowFacebookModal(false);
            if (navigation) {
                navigation.navigate('Home');
            }
        } catch (err) {
            console.warn('[FacebookModal] error:', err);
            setShowFacebookModal(false);
            if (navigation) {
                navigation.navigate('Home');
            }
        } finally {
            setFbLoggingIn(false);
        }
    };

    const handleContinueAsGuest = () => {
        if (navigation) {
            navigation.navigate('Home');
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A12" />

            <View style={styles.content}>
                {/* Hero Logo Section */}
                <View style={styles.heroSection}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconGradientLayer1} />
                        <View style={styles.iconGradientLayer2} />
                        <View style={styles.iconInner}>
                            <Play
                                color="#FFFFFF"
                                size={32}
                                fill="#FFFFFF"
                                strokeWidth={0}
                            />
                        </View>
                    </View>

                    <Text style={styles.title}>Welcome to Streamr</Text>
                    <Text style={styles.subtitle}>Log in with your Google or Facebook account to start watching</Text>
                </View>

                {/* Direct Social Login Actions */}
                <View style={styles.buttonsSection}>
                    {/* Google Direct Login */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.socialButton,
                            pressed && styles.socialButtonPressed,
                            loadingProvider !== null && styles.socialButtonDisabled,
                        ]}
                        onPress={() => handleSocialLogin('google')}
                        disabled={loadingProvider !== null}
                    >
                        {loadingProvider === 'google' ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <View style={styles.socialButtonContent}>
                                <View style={styles.googleIconCircle}>
                                    <Text style={styles.googleIconText}>G</Text>
                                </View>
                                <Text style={styles.socialButtonText}>Log in with Google</Text>
                            </View>
                        )}
                    </Pressable>

                    {/* Facebook Direct Login */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.socialButton,
                            pressed && styles.socialButtonPressed,
                            loadingProvider !== null && styles.socialButtonDisabled,
                        ]}
                        onPress={() => handleSocialLogin('facebook')}
                        disabled={loadingProvider !== null}
                    >
                        {loadingProvider === 'facebook' ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <View style={styles.socialButtonContent}>
                                <View style={styles.facebookIconCircle}>
                                    <Text style={styles.facebookIconText}>f</Text>
                                </View>
                                <Text style={styles.socialButtonText}>Log in with Facebook</Text>
                            </View>
                        )}
                    </Pressable>

                    {/* Continue as Guest Button */}
                    <Pressable
                        style={{ marginTop: 22, alignSelf: 'center', padding: 8 }}
                        onPress={handleContinueAsGuest}
                    >
                        <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600' }}>
                            Skip & Continue as Guest →
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Exact Facebook Native Login Screen Modal matching User Design */}
            <Modal
                visible={showFacebookModal}
                animationType="slide"
                onRequestClose={() => setShowFacebookModal(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                    <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
                        {/* Header: < Log in to Facebook */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 36 }}>
                            <Pressable
                                onPress={() => setShowFacebookModal(false)}
                                style={{ padding: 8, marginLeft: -8, marginRight: 12 }}
                            >
                                <ChevronLeft size={28} color="#050505" />
                            </Pressable>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#050505' }}>
                                Log in to Facebook
                            </Text>
                        </View>

                        {/* Form Inputs */}
                        <View style={{ gap: 16 }}>
                            <View style={{ borderWidth: 1.5, borderColor: '#8A8D91', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 }}>
                                <Text style={{ fontSize: 11, color: '#65676B', marginTop: 4 }}>Email address or mobile number</Text>
                                <TextInput
                                    style={{ fontSize: 16, color: '#050505', paddingVertical: 8 }}
                                    placeholder=""
                                    placeholderTextColor="#8A8D91"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={fbEmailOrPhone}
                                    onChangeText={setFbEmailOrPhone}
                                />
                            </View>

                            <View style={{ borderWidth: 1.5, borderColor: '#8A8D91', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 }}>
                                <Text style={{ fontSize: 11, color: '#65676B', marginTop: 4 }}>Password</Text>
                                <TextInput
                                    style={{ fontSize: 16, color: '#050505', paddingVertical: 8 }}
                                    placeholder=""
                                    placeholderTextColor="#8A8D91"
                                    secureTextEntry
                                    value={fbPassword}
                                    onChangeText={setFbPassword}
                                />
                            </View>

                            <Pressable
                                style={({ pressed }) => [{
                                    backgroundColor: '#0064E0',
                                    borderRadius: 24,
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
        </SafeAreaView>
    );
}
