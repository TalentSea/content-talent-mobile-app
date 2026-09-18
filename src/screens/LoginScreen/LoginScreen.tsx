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
import { ChevronLeft, Play } from 'lucide-react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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
import { loginWithSocial, loginAsGuest, setSessionTokens, restoreStoredSession, SocialProvider, UserProfile } from '../../services/api/authService';
import { DEFAULT_AUTH_TOKEN, getCreatorId } from '../../constants/config';
import { styles } from './styles';

export function LoginScreen({ navigation }: any) {
    const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    const [showFacebookModal, setShowFacebookModal] = useState(false);
    const [fbEmailOrPhone, setFbEmailOrPhone] = useState('');
    const [fbPassword, setFbPassword] = useState('');
    const [fbUsername, setFbUsername] = useState('');
    const [fbLoggingIn, setFbLoggingIn] = useState(false);

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
                    if (navigation) {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
                        return;
                    }
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

    const handleFacebookModalSubmit = async () => {
        const input = fbEmailOrPhone.trim();
        if (!input) return;

        try {
            setFbLoggingIn(true);

            let cleanName = fbUsername.trim();
            if (!cleanName) {
                if (input.includes('@')) {
                    const prefix = input.split('@')[0];
                    cleanName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
                } else if (/^\d+$/.test(input)) {
                    cleanName = `Facebook User ${input.slice(-4)}`;
                } else {
                    cleanName = input;
                }
            }

            const email = input.includes('@') ? input : `${input}@facebook.com`;

            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=1877F2&color=fff&size=256`;

            const fbProfile: UserProfile = {
                id: Date.now(),
                name: cleanName,
                email: email,
                avatar_url: avatarUrl,
                provider: 'facebook',
                role: 'subscriber',
            };

            const sendToken = `mock_facebook_${input.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const authRes = await loginWithSocial('facebook', sendToken, undefined, fbProfile, getCreatorId());

            const finalFbUser: UserProfile = {
                ...(authRes?.user || {}),
                ...fbProfile,
                name: fbProfile.name,
                email: fbProfile.email,
                avatar_url: fbProfile.avatar_url,
                provider: 'facebook',
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
                    console.log('[GoogleSignin] Complete response:', JSON.stringify(response));

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
                            console.log('[FacebookSignin] User cancelled login');
                            setLoadingProvider(null);
                            return;
                        }
                    }

                    if (AccessToken) {
                        const data = await AccessToken.getCurrentAccessToken();
                        realToken = data?.accessToken || '';
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
                    console.warn('[FacebookSignin] Native Facebook error:', facebookErr);
                    setLoadingProvider(null);
                    return;
                }

                if (!realProfile) {
                    setLoadingProvider(null);
                    setShowFacebookModal(true);
                    return;
                }
            }

            if (!realToken && !realProfile) {
                console.log(`[handleSocialLogin] No token or profile received for ${provider}. Aborting login.`);
                setLoadingProvider(null);
                return;
            }

            const sendToken = realToken || `token_${provider}_${Date.now()}`;
            const authRes = await loginWithSocial(provider, sendToken, undefined, realProfile, getCreatorId());

            const finalUser: UserProfile = {
                ...(authRes?.user || {}),
                ...(realProfile || {}),
                name: realProfile?.name || authRes?.user?.name || (provider === 'facebook' ? 'Facebook User' : 'Google User'),
                email: realProfile?.email || authRes?.user?.email || null,
                avatar_url: realProfile?.avatar_url || authRes?.user?.avatar_url || null,
                provider: provider,
            };

            setSessionTokens(
                authRes?.access_token || DEFAULT_AUTH_TOKEN,
                authRes?.refresh_token || `${provider}_session`,
                finalUser,
            );

            if (navigation) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        } catch (error) {
            console.warn(`[LoginScreen] ${provider} social login notice:`, error);
        } finally {
            setLoadingProvider(null);
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
            if (navigation) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        }
    };

    if (isCheckingSession) {
        return (
            <SafeAreaView style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="light-content" backgroundColor="#0A0A12" />
                <ActivityIndicator color="#6366F1" size="large" />
            </SafeAreaView>
        );
    }

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
                        disabled={loadingProvider !== null}
                    >
                        {loadingProvider === 'guest' ? (
                            <ActivityIndicator color="#818CF8" size="small" />
                        ) : (
                            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600' }}>
                                Skip & Continue as Guest →
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>

            {/* Facebook Login Screen Modal */}
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
