import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StatusBar,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth0 } from 'react-native-auth0';
import { Play } from 'lucide-react-native';
import { styles } from './styles';

export function LoginScreen() {
    const { authorize, isLoading } = useAuth0();
    const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);

    const handleSocialLogin = async (connection: string) => {
        try {
            setLoadingProvider(connection);
            await authorize({
                scope: 'openid profile email',
                connection,
                additionalParameters: {
                    screen_hint: 'login',  // Force login, no signup
                },
            });
        } catch (error) {
            console.warn('Login failed:', error);
        } finally {
            setLoadingProvider(null);
        }
    };

    const isDisabled = isLoading || loadingProvider !== null;

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A12" />

            <View style={styles.content}>
                {/* Play Icon with gradient-like background */}
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

                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue watching</Text>
                </View>

                {/* Social Login Buttons */}
                <View style={styles.buttonsSection}>
                    {/* Google Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.socialButton,
                            pressed && styles.socialButtonPressed,
                            isDisabled && styles.socialButtonDisabled,
                        ]}
                        onPress={() => handleSocialLogin('google-oauth2')}
                        disabled={isDisabled}
                    >
                        {loadingProvider === 'google-oauth2' ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <View style={styles.socialButtonContent}>
                                <View style={styles.googleIconCircle}>
                                    <Text style={styles.googleIconText}>G</Text>
                                </View>
                                <Text style={styles.socialButtonText}>Continue with Google</Text>
                            </View>
                        )}
                    </Pressable>

                    {/* Facebook Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.socialButton,
                            pressed && styles.socialButtonPressed,
                            isDisabled && styles.socialButtonDisabled,
                        ]}
                        onPress={() => handleSocialLogin('facebook')}
                        disabled={isDisabled}
                    >
                        {loadingProvider === 'facebook' ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <View style={styles.socialButtonContent}>
                                <View style={styles.facebookIconCircle}>
                                    <Text style={styles.facebookIconText}>f</Text>
                                </View>
                                <Text style={styles.socialButtonText}>Continue with Facebook</Text>
                            </View>
                        )}
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
