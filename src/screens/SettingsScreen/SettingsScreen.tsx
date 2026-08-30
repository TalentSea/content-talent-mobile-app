import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Download,
  Globe,
  HardDrive,
  Info,
  Lock,
  Moon,
  Play,
  Shield,
  Smartphone,
} from 'lucide-react-native';
import { getCurrentUser } from '../../services/api/authService';
import { styles } from './styles';

export function SettingsScreen({ navigation }: any) {
  const user = getCurrentUser();

  const [autoplay, setAutoplay] = useState(true);
  const [wifiOnlyDownloads, setWifiOnlyDownloads] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [hdPlayback, setHdPlayback] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#FFFFFF" size={20} />
        </Pressable>
        <Text style={styles.headerTitle}>App Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Playback & Streaming */}
        <Text style={styles.sectionHeader}>Video Playback</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Play size={18} color="#6366F1" />
              <View>
                <Text style={styles.rowTitle}>Autoplay Next Video</Text>
                <Text style={styles.rowSub}>Automatically start related content</Text>
              </View>
            </View>
            <Switch
              value={autoplay}
              onValueChange={setAutoplay}
              trackColor={{ false: '#374151', true: '#6366F1' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Smartphone size={18} color="#6366F1" />
              <View>
                <Text style={styles.rowTitle}>Prefer High Definition (HD)</Text>
                <Text style={styles.rowSub}>Stream 1080p when available</Text>
              </View>
            </View>
            <Switch
              value={hdPlayback}
              onValueChange={setHdPlayback}
              trackColor={{ false: '#374151', true: '#6366F1' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 2: Downloads & Storage */}
        <Text style={styles.sectionHeader}>Downloads & Storage</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Download size={18} color="#10B981" />
              <View>
                <Text style={styles.rowTitle}>Download via Wi-Fi Only</Text>
                <Text style={styles.rowSub}>Save mobile data bandwidth</Text>
              </View>
            </View>
            <Switch
              value={wifiOnlyDownloads}
              onValueChange={setWifiOnlyDownloads}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <HardDrive size={18} color="#10B981" />
              <Text style={styles.rowTitle}>Offline Storage</Text>
            </View>
            <Text style={styles.rowValue}>1.2 GB Used</Text>
          </View>
        </View>

        {/* Section 3: Notifications & Preferences */}
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Bell size={18} color="#F59E0B" />
              <View>
                <Text style={styles.rowTitle}>Push Notifications</Text>
                <Text style={styles.rowSub}>Alerts for new uploads and series</Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#374151', true: '#F59E0B' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 4: Account & Info */}
        <Text style={styles.sectionHeader}>Account & About</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('Subscription')}
          >
            <View style={styles.rowLeft}>
              <Shield size={18} color="#818CF8" />
              <View>
                <Text style={styles.rowTitle}>VIP Subscription Tiers</Text>
                <Text style={styles.rowSub}>Basic, Premium, or Annual Plans</Text>
              </View>
            </View>
            <Text style={[styles.rowValue, { color: '#6366F1', fontWeight: '800' }]}>Manage Tiers →</Text>
          </Pressable>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Shield size={18} color="#818CF8" />
              <Text style={styles.rowTitle}>Account Status</Text>
            </View>
            <Text style={styles.rowValue}>
              {user?.role ? user.role.toUpperCase() : 'GUEST'}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Globe size={18} color="#818CF8" />
              <Text style={styles.rowTitle}>API Server Endpoint</Text>
            </View>
            <Text style={styles.rowValue}>138.68.140.83:8000</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Info size={18} color="#818CF8" />
              <Text style={styles.rowTitle}>App Version</Text>
            </View>
            <Text style={styles.rowValue}>v2.4.0 (Build 2026)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
