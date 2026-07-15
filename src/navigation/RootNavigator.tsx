import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
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
                <Stack.Screen name="VideoGrid" component={VideoGridScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}