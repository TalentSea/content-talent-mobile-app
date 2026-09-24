import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Home, Grid, User } from 'lucide-react-native';

import type { MainTabParamList } from './types';
import { HomeStack } from './HomeStack';
import { CategoriesStack } from './CategoriesStack';
import { ProfileStack } from './ProfileStack';

import { useAppTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Custom Tab Bar ─────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: any) {
  const { theme } = useAppTheme();
  const tabs = [
    { name: 'HomeTab', label: 'Home', Icon: Home },
    { name: 'CategoriesTab', label: 'Categories', Icon: Grid },
    { name: 'ProfileTab', label: 'Profile', Icon: User },
  ] as const;

  const activeRouteName = state.routes[state.index].name;

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackgroundColor, borderTopColor: theme.mainBackgroundColor }]}>
      {tabs.map(({ name, label, Icon }) => {
        const isActive = activeRouteName === name;
        const color = isActive ? theme.activeStateColor : theme.mutedTextColor;

        return (
          <Pressable
            key={name}
            style={styles.tab}
            onPress={() => navigation.navigate(name)}
          >
            <Icon size={20} color={color} />
            <Text style={[styles.tabText, { color: isActive ? theme.activeStateColor : theme.mutedTextColor, fontWeight: isActive ? '700' : '600' }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Tab Navigator ───────────────────────────────────────────────────────────
export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="CategoriesTab" component={CategoriesStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0F0F1A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
  },
  tabText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#6366F1',
    fontWeight: '700',
  },
});
