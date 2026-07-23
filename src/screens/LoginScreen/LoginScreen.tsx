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
import { Shield } from 'lucide-react-native';
import { styles } from './styles';
import { colors } from '../../constants/colors';

export function LoginScreen() {
    const { authorize, isLoading } = useAuth0();

    const handleLogin = async () => {
        try {
            await authorize({
                scope: 'openid profile email'
            });
        } catch (error) {
            console.warn('Login failed:', error);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="light-content" />

            {/* Dynamic visual blobs for glowing theme */}
            <View style={[styles.glowBlob, styles.blob1]} />
            <View style={[styles.glowBlob, styles.blob2]} />

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoGlow}>
                        <Shield color={colors.primary} size={48} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.logoText}>Streamr</Text>
                    <Text style={styles.tagline}>Elevate Your Video Experience</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Welcome back</Text>
                    <Text style={styles.cardSubtitle}>
                        Sign in to access your dashboard, track rendering status, and enjoy premium streams.
                    </Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.loginButton,
                            pressed && styles.loginButtonPressed,
                        ]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.loginButtonText}>Get Started</Text>
                        )}
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Secured by Auth0</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
