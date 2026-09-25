import { useAppTheme } from '../../context/ThemeContext';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, PlayCircle, Sparkles, CheckCheck } from 'lucide-react-native';
import { styles } from './styles';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'video' | 'system' | 'featured';
};

export function NotificationsScreen({ navigation }: any) {
  const { theme } = useAppTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handleToggleRead(id: string) {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.mainBackgroundColor }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color={theme.primaryTextColor} size={20} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>Notifications</Text>
        </View>

        <Pressable onPress={handleMarkAllRead}>
          <Text style={[styles.markReadText, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>Mark all read</Text>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            tintColor={theme.primaryTextColor}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 20 }}>
            <Bell size={44} color={theme.mutedTextColor} style={{ marginBottom: 12 }} />
            <Text style={{ color: theme.primaryTextColor, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
              No Notifications
            </Text>
            <Text style={{ color: theme.mutedTextColor, fontSize: 13, textAlign: 'center' }}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.itemCard, !item.read && styles.unreadCard]}
            onPress={() => handleToggleRead(item.id)}
          >
            <View style={styles.iconBox}>
              {item.type === 'video' ? (
                <PlayCircle size={20} color="#6366F1" />
              ) : item.type === 'featured' ? (
                <Sparkles size={20} color="#F59E0B" />
              ) : (
                <Bell size={20} color="#10B981" />
              )}
            </View>

            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{item.title}</Text>
              <Text style={[styles.itemBody, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{item.body}</Text>
              <Text style={[styles.itemTime, { color: theme.primaryTextColor }, { color: theme.primaryTextColor }]}>{item.time}</Text>
            </View>

            {!item.read ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
