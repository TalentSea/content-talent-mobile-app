import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { PlayerScreen } from '../screens/PlayerScreen/PlayerModal';
const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="PlayerScreen" 
        component={PlayerScreen} 
        options={{ headerShown: false }}
     />
    </Stack.Navigator>
  );
};