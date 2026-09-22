import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CategoriesStackParamList } from './types';

import { CategoriesScreen } from '../screens/CategoriesScreen/CategoriesScreen';
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen/CategoryDetailScreen';

const Stack = createNativeStackNavigator<CategoriesStackParamList>();

export function CategoriesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#05050A' },
      }}
    >
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
    </Stack.Navigator>
  );
}
