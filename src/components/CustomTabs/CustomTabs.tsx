import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { styles } from './styles';

interface CustomTabsProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tabName: string) => void;
  containerStyle?: ViewStyle;
}

export const CustomTabs: React.FC<CustomTabsProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  containerStyle,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.tabsContainer, containerStyle]}
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.7}
            style={[styles.tabPill, isActive && styles.activeTabPill]}
            onPress={() => onSelectTab(tab)}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
