import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';

import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen/SearchScreen';
import { VideoGridScreen } from '../screens/VideoGridScreen/VideoGridScreen';
import { PlaylistScreen } from '../screens/PlaylistScreen/PlaylistScreen';
import { PlaylistDetailScreen } from '../screens/PlaylistDetailScreen/PlaylistDetailScreen';

import { useAppTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { theme } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.mainBackgroundColor },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="VideoGrid" component={VideoGridScreen} />
      <Stack.Screen name="Playlist" component={PlaylistScreen} />
      <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
    </Stack.Navigator>
  );
}
