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

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'New Video Uploaded!',
    body: 'Tears of Steel HLS Demo has been published by Alex OTT Creator.',
    time: '10m ago',
    read: false,
    type: 'video',
  },
  {
    id: '2',
    title: 'New Masterclass Available',
    body: 'React Native Architecture & TurboModules series is now live.',
    time: '2h ago',
    read: false,
    type: 'featured',
  },
  {
    id: '3',
    title: 'System Maintenance Complete',
    body: 'Bunny CDN video streaming infrastructure optimization completed.',
    time: '1d ago',
    read: true,
    type: 'system',
  },
];

export function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

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
