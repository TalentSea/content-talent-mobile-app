import React from 'react';
import { CardType1 } from './CardType1/CardType1';
import { CardType2 } from './CardType2/CardType2';

interface VideoCardProps {
  type: 'type1' | 'type2';
  data: any;
  onPress?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ type, data, onPress }) => {
  if (type === 'type2') {
    return <CardType2 data={data} onPress={onPress} />;
  }
  return <CardType1 data={data} onPress={onPress} />;
};