import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/LoginScreen/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { CategoryVideosScreen } from '../screens/CategoryVideosScreen/CategoryVideosScreen';
import { PlaylistScreen } from '../screens/PlaylistScreen/PlaylistScreen';
import { SearchScreen } from '../screens/SearchScreen/SearchScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen/CategoriesScreen';
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen/CategoryDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen/ProfileScreen';
import { VideoGridScreen } from '../screens/VideoGridScreen/VideoGridScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen/SettingsScreen';
import { LibraryScreen } from '../screens/LibraryScreen/LibraryScreen';
import { LibraryProvider } from '../contexts/LibraryContext';
import { restoreStoredSession } from '../services/api/authService';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
    const [isInitializing, setIsInitializing] = useState(true);
    const [initialRoute, setInitialRoute] = useState<'Home' | 'Login'>('Login');

    useEffect(() => {
        let isMounted = true;
        async function checkInitialAuth() {
            try {
                const user = await restoreStoredSession();
                if (user && isMounted) {
                    console.log('[RootNavigator] Initial session restored for user:', user.name);
                    setInitialRoute('Home');
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
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="CategoryVideos" component={CategoryVideosScreen} />
                <Stack.Screen name="Playlist" component={PlaylistScreen} />
                <Stack.Screen name="Search" component={SearchScreen} />
                <Stack.Screen name="Categories" component={CategoriesScreen} />
                <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Library" component={LibraryScreen} />
                <Stack.Screen name="VideoGrid" component={VideoGridScreen} />
            </Stack.Navigator>
        </NavigationContainer>
        </LibraryProvider>
    );
}
