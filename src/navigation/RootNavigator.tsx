import React from 'react';
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
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
    return (
        <LibraryProvider>
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
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
