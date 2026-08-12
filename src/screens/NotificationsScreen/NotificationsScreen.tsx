import React from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { styles } from './styles';

export function NotificationsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={10}>
          <ChevronLeft color={colors.text} size={25} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.emptyState}>
        <View style={styles.iconWrap}><Bell color={colors.primary} size={30} /></View>
        <Text style={styles.emptyTitle}>You’re all caught up</Text>
        <Text style={styles.emptyDescription}>Updates about videos, downloads, and playlists will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}
