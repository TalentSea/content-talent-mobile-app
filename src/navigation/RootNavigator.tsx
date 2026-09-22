import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen, RegisterScreen } from '../screens/LoginScreen/LoginScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { LibraryProvider } from '../contexts/LibraryContext';
import { restoreStoredSession, isUserLoggedIn } from '../services/api/authService';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
    const [isInitializing, setIsInitializing] = useState(true);
    const [initialRoute, setInitialRoute] = useState<'MainTabs' | 'Login'>('Login');

    useEffect(() => {
        let isMounted = true;
        async function checkInitialAuth() {
            try {
                const user = await restoreStoredSession();
                const loggedIn = isUserLoggedIn();
                if (user && loggedIn && isMounted) {
                    console.log('[RootNavigator] Initial session restored for logged-in user:', user.name);
                    setInitialRoute('MainTabs');
                } else if (isMounted) {
                    setInitialRoute('Login');
                }
            } catch (err) {
                console.warn('[RootNavigator] Initial auth restore notice:', err);
                if (isMounted) setInitialRoute('Login');
            } finally {
                if (isMounted) setIsInitializing(false);
            }
        }
        checkInitialAuth();
        return () => {
            isMounted = false;
        };
    }, []);

    if (isInitializing) {
        return (
            <View style={{ flex: 1, backgroundColor: '#05050A', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366F1" />
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
                        contentStyle: { backgroundColor: '#05050A' },
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
