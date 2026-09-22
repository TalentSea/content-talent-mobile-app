import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';

import { ProfileScreen } from '../screens/ProfileScreen/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen/NotificationsScreen';
import { LibraryScreen } from '../screens/LibraryScreen/LibraryScreen';
import { SettingsScreen } from '../screens/SettingsScreen/SettingsScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen/SubscriptionScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05050A' },
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
    </Stack.Navigator>
  );
}
