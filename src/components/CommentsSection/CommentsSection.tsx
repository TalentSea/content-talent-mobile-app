import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { Heart, Send, MessageSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import {
  fetchVideoComments,
  fetchCommentReplies,
  postCommentReply,
  toggleCommentLike,
  createTopLevelComment,
  deleteComment,
  deleteCommentReply,
  CommentItem,
  CommentReplyItem,
} from '../../services/api/commentsApi';
import { styles } from './styles';

type CommentsSectionProps = {
  videoId?: number;
};

function deduplicateComments(items: CommentItem[]): CommentItem[] {
  const seen = new Set<number>();
  const result: CommentItem[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

export function CommentsSection({ videoId = 1 }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');

  // Track expanded replies for each comment ID
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});
  // Track active reply input box for a specific comment ID
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadComments() {
      try {
        setLoading(true);
        const response = await fetchVideoComments(videoId);
        if (isMounted) {
          setComments(deduplicateComments(response.items || []));
        }
      } catch (err) {
        console.warn('[CommentsSection] Error loading comments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadComments();
    return () => {
      isMounted = false;
    };
  }, [videoId]);

  async function handleAddTopLevelComment() {
    if (!inputText.trim()) return;
    try {
      const textToPost = inputText.trim();
      setInputText('');
      const newComment = await createTopLevelComment(videoId, textToPost);
      setComments(prev => deduplicateComments([newComment, ...prev]));
    } catch (err) {
      console.warn('[CommentsSection] Error posting comment:', err);
    }
  }

  async function handleDeleteComment(commentId: number) {
    try {
      setComments(prev => prev.filter(c => c.id !== commentId));
      await deleteComment(commentId);
    } catch (err) {
      console.warn('[CommentsSection] Error deleting comment:', err);
    }
  }

  async function handleDeleteReply(commentId: number, replyId: number) {
    try {
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId && c.replies) {
            const updatedReplies = c.replies.filter(r => r.id !== replyId);
            return {
              ...c,
              reply_count: updatedReplies.length,
              replies: updatedReplies,
            };
          }
          return c;
        }),
      );
      await deleteCommentReply(commentId, replyId);
    } catch (err) {
      console.warn('[CommentsSection] Error deleting reply:', err);
    }
  }

  async function handleToggleLike(commentId: number) {
    try {
      const result = await toggleCommentLike(commentId);
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? { ...c, is_liked: result.is_liked, likes: result.likes }
            : c,
        ),
      );
    } catch (err) {
      console.warn('[CommentsSection] Error toggling like:', err);
    }
  }

  async function handleToggleViewReplies(commentId: number) {
    const isExpanded = !expandedReplies[commentId];
    setExpandedReplies(prev => ({ ...prev, [commentId]: isExpanded }));

    // If expanding and replies not loaded yet, fetch them from backend
    if (isExpanded) {
      const targetComment = comments.find(c => c.id === commentId);
      if (targetComment && (!targetComment.replies || targetComment.replies.length === 0)) {
        try {
          const res = await fetchCommentReplies(commentId);
          if (res && res.items) {
            setComments(prev =>
              prev.map(c =>
                c.id === commentId ? { ...c, replies: res.items } : c,
              ),
            );
          }
        } catch (err) {
          console.warn('[CommentsSection] Error fetching replies:', err);
        }
      }
    }
  }

  async function handleSendReply(parentCommentId: number) {
    if (!replyText.trim()) return;
    try {
      const textToReply = replyText.trim();
      setReplyText('');
      setReplyingToId(null);
      const newReply = await postCommentReply(parentCommentId, textToReply);

      setComments(prev =>
        prev.map(c => {
          if (c.id === parentCommentId) {
            const existingReplies = c.replies || [];
            const filteredReplies = existingReplies.filter(r => r.id !== newReply.id);
            return {
              ...c,
              reply_count: filteredReplies.length + 1,
              replies: [...filteredReplies, newReply],
            };
          }
          return c;
        }),
      );

      setExpandedReplies(prev => ({ ...prev, [parentCommentId]: true }));
    } catch (err) {
      console.warn('[CommentsSection] Error posting reply:', err);
    }
  }

  if (loading) {
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator color="#E50914" size="small" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

      {/* Post Top-Level Comment Bar */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a public comment..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={setInputText}
        />
        <Pressable style={styles.sendButton} onPress={handleAddTopLevelComment}>
          <Send size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Comments Feed */}
      {comments.map((item, index) => (
        <View key={`comment-${item.id}-${index}`} style={styles.commentCard}>
          {/* Comment Header */}
          <View style={styles.commentHeader}>
            <View style={styles.userRow}>
              {item.user_avatar ? (
                <Image source={{ uri: item.user_avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar} />
              )}
              <Text style={styles.userName}>{item.user_name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={styles.timeText}>
                {item.created_at ? 'recently' : '2h ago'}
              </Text>
              <Pressable
                onPress={() => handleDeleteComment(item.id)}
                hitSlop={8}
                style={{ padding: 2 }}
              >
                <Trash2 size={14} color="#EF4444" />
              </Pressable>
            </View>
          </View>

          {/* Comment Text */}
          <Text style={styles.commentText}>{item.text}</Text>

          {/* Comment Footer Actions: Likes + Reply Button + View Replies */}
          <View style={styles.commentFooter}>
            <Pressable
              style={styles.likeButton}
              onPress={() => handleToggleLike(item.id)}
            >
              <Heart
                size={14}
                color={item.is_liked ? '#EF4444' : '#9CA3AF'}
                fill={item.is_liked ? '#EF4444' : 'transparent'}
              />
              <Text style={styles.likeCount}>{item.likes}</Text>
            </Pressable>

            <Pressable
              style={styles.replyActionButton}
              onPress={() =>
                setReplyingToId(prev => (prev === item.id ? null : item.id))
              }
            >
              <MessageSquare size={14} color="#9CA3AF" />
              <Text style={styles.replyActionText}>Reply</Text>
            </Pressable>

            {item.reply_count > 0 || (item.replies && item.replies.length > 0) ? (
              <Pressable
                style={styles.viewRepliesToggle}
                onPress={() => handleToggleViewReplies(item.id)}
              >
                {expandedReplies[item.id] ? (
                  <ChevronUp size={14} color="#E50914" />
                ) : (
                  <ChevronDown size={14} color="#E50914" />
                )}
                <Text style={styles.viewRepliesText}>
                  {expandedReplies[item.id]
                    ? 'Hide replies'
                    : `${item.reply_count || item.replies?.length || 1} replies`}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Inline Reply Input Box */}
          {replyingToId === item.id && (
            <View style={styles.inlineReplyBox}>
              <TextInput
                style={styles.inlineReplyInput}
                placeholder={`Reply to ${item.user_name}...`}
                placeholderTextColor="#6B7280"
                value={replyText}
                onChangeText={setReplyText}
                autoFocus
              />
              <Pressable
                style={styles.inlineReplySubmit}
                onPress={() => handleSendReply(item.id)}
              >
                <Text style={styles.inlineReplySubmitText}>Reply</Text>
              </Pressable>
            </View>
          )}

          {/* Threaded Nested Replies */}
          {expandedReplies[item.id] && item.replies && item.replies.length > 0 && (
            <View style={styles.repliesSection}>
              {item.replies.map((reply, rIdx) => (
                <View key={`reply-${reply.id}-${rIdx}`} style={styles.replyCard}>
                  <View style={styles.replyHeader}>
                    <Text style={styles.replyUser}>{reply.user_name}</Text>
                    <Pressable
                      onPress={() => handleDeleteReply(item.id, reply.id)}
                      hitSlop={8}
                      style={{ padding: 2 }}
                    >
                      <Trash2 size={12} color="#EF4444" />
                    </Pressable>
                  </View>
                  <Text style={styles.replyText}>{reply.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
