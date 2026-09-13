import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#FFFFFF" size={20} />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <Pressable onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 20 }}>
            <Bell size={44} color="#475569" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
              No Notifications
            </Text>
            <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
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
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
              <Text style={styles.itemTime}>{item.time}</Text>
            </View>

            {!item.read ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
