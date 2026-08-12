import React, { useState } from 'react';
import { Pressable, StatusBar, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, ChevronRight, CircleHelp, Moon, Wifi } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { styles } from './styles';

export function SettingsScreen({ navigation }: any) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={10}>
          <ChevronLeft color={colors.text} size={25} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.iconWrap}><Bell color={colors.primary} size={20} /></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>Push notifications</Text>
              <Text style={styles.rowDescription}>Updates about your videos</Text>
            </View>
            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: '#343442', true: colors.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.iconWrap}><Wifi color={colors.primary} size={20} /></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>Download on Wi-Fi only</Text>
              <Text style={styles.rowDescription}>Save mobile data</Text>
            </View>
            <Switch value={wifiOnly} onValueChange={setWifiOnly} trackColor={{ false: '#343442', true: colors.primary }} thumbColor="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.iconWrap}><Moon color={colors.primary} size={20} /></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>Appearance</Text>
              <Text style={styles.rowDescription}>Dark theme</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.row}>
            <View style={styles.iconWrap}><CircleHelp color={colors.primary} size={20} /></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>Help & support</Text>
              <Text style={styles.rowDescription}>Get help with Streamr</Text>
            </View>
            <ChevronRight color={colors.muted} size={20} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
