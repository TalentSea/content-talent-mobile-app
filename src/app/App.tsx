import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Auth0Provider } from 'react-native-auth0';
import { RootNavigator } from '../navigation/RootNavigator';
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from '../constants/auth';

export default function App() {
  return (
    <Auth0Provider domain={AUTH0_DOMAIN} clientId={AUTH0_CLIENT_ID}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </Auth0Provider>
  );
}