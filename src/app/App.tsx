import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '../navigation/RootNavigator';
import { restoreStoredSession } from '../services/api/authService';

export default function App() {
  useEffect(() => {
    restoreStoredSession().catch(err => {
      console.warn('[App] Error initializing session on startup:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}