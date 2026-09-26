import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen, RegisterScreen } from '../screens/LoginScreen/LoginScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { LibraryProvider } from '../contexts/LibraryContext';
import { restoreStoredSession, isUserLoggedIn } from '../services/api/authService';
import { fetchMobileBrandingApi } from '../services/api/brandingApi';
import { useAppTheme } from '../context/ThemeContext';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
    const [isInitializing, setIsInitializing] = useState(true);
    const [initialRoute, setInitialRoute] = useState<'MainTabs' | 'Login'>('Login');
    const { theme, setTheme, setBranding } = useAppTheme();

    useEffect(() => {
        let isMounted = true;

        async function runUnifiedBootstrap() {
            try {
                // Unified single-trip bootstrap:
                // Fetch session and branding concurrently to optimize cold boot
                const [user, brandingData] = await Promise.all([
                    restoreStoredSession(),
                    fetchMobileBrandingApi().catch(err => {
                        console.warn('[RootNavigator] Branding fetch failed:', err);
                        return null;
                    })
                ]);

                if (brandingData && isMounted) {
                    setBranding(brandingData);
                    if (brandingData.colors) {
                        setTheme(brandingData.colors);
                    }
                }

                const loggedIn = isUserLoggedIn();

                if (user && loggedIn && isMounted) {
                    console.log('[RootNavigator] Initial session restored for logged-in user:', user.name);
                    setInitialRoute('MainTabs');
                } else if (isMounted) {
                    setInitialRoute('Login');
                }
            } catch (err) {
                console.warn('[RootNavigator] Unified bootstrap notice:', err);
                if (isMounted) setInitialRoute('Login');
            } finally {
                if (isMounted) setIsInitializing(false);
            }
        }

        runUnifiedBootstrap();

        return () => {
            isMounted = false;
        };
    }, []);

    if (isInitializing) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.mainBackgroundColor, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primaryColor} />
            </View>
        );
    }

    return (
        <LibraryProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName={initialRoute}
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: theme.mainBackgroundColor },
                    }}
                >
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    {/* MainTabs hosts the persistent BottomTabNavigator */}
                    <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                </Stack.Navigator>
            </NavigationContainer>
        </LibraryProvider>
    );
}
