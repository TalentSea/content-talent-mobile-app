import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Home, Film, Grid, User } from 'lucide-react-native';
import { styles } from './styles';

type BottomNavBarProps = {
  activeTab: 'Home' | 'Shorts' | 'Categories' | 'Profile';
  navigation: any;
};

export function BottomNavBar({ activeTab, navigation }: BottomNavBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('Home')}
      >
        <Home
          size={20}
          color={activeTab === 'Home' ? '#6366F1' : '#6B7280'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Home' && styles.activeTabText,
          ]}
        >
          Home
        </Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('Shorts')}
      >
        <Film
          size={20}
          color={activeTab === 'Shorts' ? '#EF4444' : '#6B7280'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Shorts' && { color: '#EF4444', fontWeight: '700' },
          ]}
        >
          Shorts
        </Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('Categories')}
      >
        <Grid
          size={20}
          color={activeTab === 'Categories' ? '#6366F1' : '#6B7280'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Categories' && styles.activeTabText,
          ]}
        >
          Categories
        </Text>
      </Pressable>

      <Pressable
        style={styles.tab}
        onPress={() => navigation.navigate('Profile')}
      >
        <User
          size={20}
          color={activeTab === 'Profile' ? '#6366F1' : '#6B7280'}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Profile' && styles.activeTabText,
          ]}
        >
          Profile
        </Text>
      </Pressable>
    </View>
  );
}


