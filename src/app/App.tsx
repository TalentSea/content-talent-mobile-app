import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '../navigation/RootNavigator';
import { setApiAccessToken } from '../services/api/client';
import { DEFAULT_AUTH_TOKEN } from '../constants/config';

setApiAccessToken(DEFAULT_AUTH_TOKEN);

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}