import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { CategoryVideosScreen } from '../screens/CategoryVideosScreen/CategoryVideosScreen';
import { PlaylistScreen } from '../screens/PlaylistScreen/PlaylistScreen';
import { SearchScreen } from '../screens/SearchScreen/SearchScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen/CategoriesScreen';
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen/CategoryDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen/ProfileScreen';
import { VideoGridScreen } from '../screens/VideoGridScreen/VideoGridScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#05050A' },
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="CategoryVideos" component={CategoryVideosScreen} />
                <Stack.Screen name="Playlist" component={PlaylistScreen} />
                <Stack.Screen name="Search" component={SearchScreen} />
                <Stack.Screen name="Categories" component={CategoriesScreen} />
                <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="VideoGrid" component={VideoGridScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}