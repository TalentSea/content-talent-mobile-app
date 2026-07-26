import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth0 } from 'react-native-auth0';

import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { VideoGridScreen } from '../screens/VideoGridScreen/VideoGridScreen';
import { LoginScreen } from '../screens/LoginScreen/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen/ProfileScreen';
import type { RootStackParamList } from './types';
import { colors } from '../constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
    // AUTH0 TEMPORARILY DISABLED — remove this bypass to re-enable auth
    // const { user, isLoading } = useAuth0();

    // if (isLoading) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color={colors.primary} />
    //         </View>
    //     );
    // }

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
                <Stack.Screen name="Profile" component={ProfileScreen} />
                {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});