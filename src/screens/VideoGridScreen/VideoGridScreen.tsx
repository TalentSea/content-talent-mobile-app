import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { GridList, GridItem } from '../../components/GridList/GridList';
import { styles } from './styles';

export const VideoGridScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // When any card in GridList is pressed:
  const handleVideoPress = (videoItem: GridItem) => {
    navigation.navigate('PlayerScreen', { video: videoItem });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Videos</Text>
      </View>

      <GridList
        onItemPress={handleVideoPress}
        numColumns={2}
      />
    </SafeAreaView>
  );
};