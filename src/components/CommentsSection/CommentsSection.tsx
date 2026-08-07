import React, { useState } from 'react';
import {
  Image,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { Heart, Send } from 'lucide-react-native';
import { styles } from './styles';

export type CommentItem = {
  id: number;
  userName: string;
  avatarUrl?: string;
  text: string;
  likes: number;
  isLiked?: boolean;
  timeAgo?: string;
};

type CommentsSectionProps = {
  comments?: CommentItem[];
  onAddComment?: (text: string) => void;
  onToggleLike?: (commentId: number) => void;
};

const DEFAULT_COMMENTS: CommentItem[] = [
  {
    id: 1,
    userName: 'Alex Johnson',
    text: 'Amazing HLS video playback quality! Super smooth transition.',
    likes: 12,
    timeAgo: '2 hours ago',
  },
  {
    id: 2,
    userName: 'Sarah Miller',
    text: 'Loved the subtitle track selection options on this player!',
    likes: 5,
    timeAgo: '5 hours ago',
  },
];

export function CommentsSection({
  comments = DEFAULT_COMMENTS,
  onAddComment,
  onToggleLike,
}: CommentsSectionProps) {
  const [inputText, setInputText] = useState('');

  function handleSend() {
    if (!inputText.trim()) return;
    if (onAddComment) {
      onAddComment(inputText.trim());
    }
    setInputText('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={setInputText}
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Send size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      {comments.map(item => (
        <View key={item.id} style={styles.commentCard}>
          <View style={styles.commentHeader}>
            <View style={styles.userRow}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar} />
              )}
              <Text style={styles.userName}>{item.userName}</Text>
            </View>
            {item.timeAgo ? (
              <Text style={styles.timeText}>{item.timeAgo}</Text>
            ) : null}
          </View>

          <Text style={styles.commentText}>{item.text}</Text>

          <View style={styles.commentFooter}>
            <Pressable
              style={styles.likeButton}
              onPress={() => onToggleLike && onToggleLike(item.id)}
            >
              <Heart
                size={14}
                color={item.isLiked ? '#EF4444' : '#9CA3AF'}
                fill={item.isLiked ? '#EF4444' : 'transparent'}
              />
              <Text style={styles.likeCount}>{item.likes}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
