import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { Heart, Send, X, Trash2 } from 'lucide-react-native';
import {
  fetchVideoComments,
  fetchCommentReplies,
  postCommentReply,
  toggleCommentLike,
  toggleReplyLike,
  createTopLevelComment,
  deleteComment,
  deleteCommentReply,
  CommentItem,
  CommentReplyItem,
} from '../../services/api/commentsApi';
import { getCurrentUser } from '../../services/api/authService';
import { styles } from './styles';

type CommentsSectionProps = {
  videoId?: number;
};

function deduplicateComments(items: CommentItem[]): CommentItem[] {
  const map = new Map<number, CommentItem>();
  for (const item of items) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '2d';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '2d';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d`;
    const diffWk = Math.floor(diffDay / 7);
    return `${diffWk}w`;
  } catch (e) {
    return '2d';
  }
}

export function CommentsSection({ videoId = 1 }: CommentsSectionProps) {
  const currentUser = getCurrentUser();
  const inputRef = useRef<TextInput>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');

  // Replying state: parent comment ID & user name being replied to
  const [replyTarget, setReplyTarget] = useState<{
    commentId: number;
    userName: string;
  } | null>(null);

  // Track expanded replies per comment ID
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

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

  async function handleSendComment() {
    const textToPost = inputText.trim();
    if (!textToPost) return;

    setInputText('');
    Keyboard.dismiss();

    if (replyTarget) {
      // Post nested reply
      const parentId = replyTarget.commentId;
      const targetUser = replyTarget.userName;
      setReplyTarget(null);

      try {
        const fullText = textToPost.startsWith(`@${targetUser}`)
          ? textToPost
          : `@${targetUser} ${textToPost}`;

        const newReply = await postCommentReply(parentId, fullText);
        newReply.reply_to_user = targetUser;

        setComments(prev =>
          prev.map(c => {
            if (c.id === parentId) {
              const existingReplies = c.replies || [];
              const filtered = existingReplies.filter(r => r.id !== newReply.id);
              return {
                ...c,
                reply_count: (c.reply_count || 0) + 1,
                replies: [...filtered, newReply],
              };
            }
            return c;
          }),
        );

        setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
      } catch (err) {
        console.warn('[CommentsSection] Error posting reply:', err);
      }
    } else {
      // Post top-level comment
      try {
        const newComment = await createTopLevelComment(videoId, textToPost);
        setComments(prev => deduplicateComments([newComment, ...prev]));
      } catch (err) {
        console.warn('[CommentsSection] Error posting comment:', err);
      }
    }
  }

  async function handleToggleLikeComment(commentId: number) {
    try {
      const res = await toggleCommentLike(commentId);
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, is_liked: res.is_liked, likes: res.likes } : c)),
      );
    } catch (err) {
      console.warn('[CommentsSection] Error toggling comment like:', err);
    }
  }

  async function handleToggleLikeReply(commentId: number, replyId: number) {
    try {
      const res = await toggleReplyLike(videoId, commentId, replyId);
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId && c.replies) {
            return {
              ...c,
              replies: c.replies.map(r =>
                r.id === replyId ? { ...r, is_liked: res.is_liked, likes: res.likes } : r,
              ),
            };
          }
          return c;
        }),
      );
    } catch (err) {
      console.warn('[CommentsSection] Error toggling reply like:', err);
    }
  }

  async function handleToggleExpandReplies(commentId: number) {
    const isExpanded = !expandedReplies[commentId];
    setExpandedReplies(prev => ({ ...prev, [commentId]: isExpanded }));

    if (isExpanded) {
      const target = comments.find(c => c.id === commentId);
      if (target && (!target.replies || target.replies.length === 0)) {
        try {
          const res = await fetchCommentReplies(commentId);
          if (res && res.items) {
            setComments(prev =>
              prev.map(c => (c.id === commentId ? { ...c, replies: res.items } : c)),
            );
          }
        } catch (err) {
          console.warn('[CommentsSection] Error fetching replies:', err);
        }
      }
    }
  }

  function promptDeleteComment(comment: CommentItem) {
    const isOwner = comment.is_owner || (currentUser && currentUser.id === comment.user_id);
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the author can delete their own comment.');
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment and its replies?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setComments(prev => prev.filter(c => c.id !== comment.id));
              await deleteComment(comment.id);
            } catch (err) {
              console.warn('[CommentsSection] Error deleting comment:', err);
            }
          },
        },
      ],
    );
  }

  function promptDeleteReply(commentId: number, reply: CommentReplyItem) {
    const isOwner = reply.is_owner || (currentUser && currentUser.id === reply.user_id);
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the author can delete their own reply.');
      return;
    }

    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setComments(prev =>
                prev.map(c => {
                  if (c.id === commentId && c.replies) {
                    const nextReplies = c.replies.filter(r => r.id !== reply.id);
                    return {
                      ...c,
                      reply_count: Math.max(0, (c.reply_count || 1) - 1),
                      replies: nextReplies,
                    };
                  }
                  return c;
                }),
              );
              await deleteCommentReply(commentId, reply.id);
            } catch (err) {
              console.warn('[CommentsSection] Error deleting reply:', err);
            }
          },
        },
      ],
    );
  }

  function startReply(parentCommentId: number, targetUser: string) {
    setReplyTarget({ commentId: parentCommentId, userName: targetUser });
    setExpandedReplies(prev => ({ ...prev, [parentCommentId]: true }));
    if (!inputText.startsWith(`@${targetUser}`)) {
      setInputText(`@${targetUser} `);
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#6366F1" size="small" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Comments ({comments.length})</Text>

      {/* Render Comments List */}
      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
        </View>
      ) : (
        comments.map((comment, idx) => {
          const isExpanded = !!expandedReplies[comment.id];
          const repliesList = comment.replies || [];
          const replyCount = Math.max(comment.reply_count || 0, repliesList.length);
          const isOwner = comment.is_owner || (currentUser && currentUser.id === comment.user_id);

          return (
            <Pressable
              key={`comment-${comment.id}-${idx}`}
              style={styles.commentRow}
              onLongPress={() => promptDeleteComment(comment)}
            >
              {/* Left Column: Avatar */}
              {comment.user_avatar ? (
                <Image source={{ uri: comment.user_avatar }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: '#4338CA', justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                    {getInitials(comment.user_name)}
                  </Text>
                </View>
              )}

              {/* Center Column: Comment Info & Body */}
              <View style={styles.commentMain}>
                <View style={styles.authorHeader}>
                  <Text style={styles.authorName}>{comment.user_name || 'User'}</Text>
                  <Text style={styles.timeText}>{formatRelativeTime(comment.created_at)}</Text>
                  {isOwner ? (
                    <Pressable
                      onPress={() => promptDeleteComment(comment)}
                      hitSlop={8}
                      style={{ marginLeft: 6 }}
                    >
                      <Trash2 size={12} color="#EF4444" />
                    </Pressable>
                  ) : null}
                </View>

                {/* Comment Content */}
                <Text style={styles.commentText}>{comment.text}</Text>

                {/* Action Links Below Text */}
                <View style={styles.actionRow}>
                  <Pressable onPress={() => startReply(comment.id, comment.user_name)}>
                    <Text style={styles.actionLink}>Reply</Text>
                  </Pressable>
                  <Text style={styles.actionDot}>•</Text>
                  <Pressable>
                    <Text style={styles.actionLink}>See translation</Text>
                  </Pressable>
                </View>

                {/* Toggle Replies Expansion */}
                {replyCount > 0 && (
                  <Pressable
                    style={styles.toggleRepliesBtn}
                    onPress={() => handleToggleExpandReplies(comment.id)}
                  >
                    <View style={styles.toggleRepliesLine} />
                    <Text style={styles.toggleRepliesText}>
                      {isExpanded
                        ? 'Hide replies'
                        : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'more replies'}`}
                    </Text>
                  </Pressable>
                )}

                {/* Nested Threaded Replies */}
                {isExpanded && repliesList.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {repliesList.map((reply, rIdx) => {
                      const words = (reply.text || '').split(' ');
                      const hasMention = words[0]?.startsWith('@');
                      const mentionTag = hasMention ? words[0] : null;
                      const replyBody = hasMention ? words.slice(1).join(' ') : reply.text;
                      const isReplyOwner = reply.is_owner || (currentUser && currentUser.id === reply.user_id);

                      return (
                        <Pressable
                          key={`reply-${reply.id}-${rIdx}`}
                          style={styles.replyRow}
                          onLongPress={() => promptDeleteReply(comment.id, reply)}
                        >                          {reply.user_avatar ? (
                            <Image source={{ uri: reply.user_avatar }} style={styles.replyAvatar} />
                          ) : (
                            <View
                              style={[
                                styles.replyAvatar,
                                { backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
                              ]}
                            >
                              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                                {getInitials(reply.user_name)}
                              </Text>
                            </View>
                          )}

                          <View style={styles.replyMain}>
                            <View style={styles.authorHeader}>
                              <Text style={styles.replyAuthorName}>{reply.user_name || 'User'}</Text>
                              <Text style={styles.timeText}>{formatRelativeTime(reply.created_at)}</Text>
                              {isReplyOwner ? (
                                <Pressable
                                  onPress={() => promptDeleteReply(comment.id, reply)}
                                  hitSlop={8}
                                  style={{ marginLeft: 4 }}
                                >
                                  <Trash2 size={11} color="#EF4444" />
                                </Pressable>
                              ) : null}
                            </View>

                            <Text style={styles.replyText}>
                              {mentionTag ? (
                                <Text style={styles.mentionText}>{mentionTag} </Text>
                              ) : null}
                              {replyBody}
                            </Text>

                            <View style={styles.actionRow}>
                              <Pressable onPress={() => startReply(comment.id, reply.user_name)}>
                                <Text style={styles.actionLink}>Reply</Text>
                              </Pressable>
                            </View>
                          </View>

                          {/* Reply Heart Icon + Like Count on Right */}
                          <View style={styles.heartColumn}>
                            <Pressable
                              onPress={() => handleToggleLikeReply(comment.id, reply.id)}
                              hitSlop={8}
                            >
                              <Heart
                                size={14}
                                color={reply.is_liked ? '#EF4444' : '#6B7280'}
                                fill={reply.is_liked ? '#EF4444' : 'transparent'}
                              />
                            </Pressable>
                            {reply.likes > 0 ? (
                              <Text style={styles.heartCountText}>{reply.likes}</Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Right Column: Heart Icon + Like Count underneath */}
              <View style={styles.heartColumn}>
                <Pressable onPress={() => handleToggleLikeComment(comment.id)} hitSlop={10}>
                  <Heart
                    size={18}
                    color={comment.is_liked ? '#EF4444' : '#6B7280'}
                    fill={comment.is_liked ? '#EF4444' : 'transparent'}
                  />
                </Pressable>
                {comment.likes > 0 ? (
                  <Text style={styles.heartCountText}>{comment.likes}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}

      {/* Clean Bottom Input Dock Container (Anchored Above Keyboard) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.bottomDockContainer}>
          {/* Replying to Header Line */}
          {replyTarget && (
            <View style={styles.replyHeaderRow}>
              <Text style={styles.replyHeaderText}>Replying to {replyTarget.userName}</Text>
              <Pressable onPress={() => setReplyTarget(null)} hitSlop={8}>
                <X size={16} color="#9CA3AF" />
              </Pressable>
            </View>
          )}

          {/* Input Field Row */}
          <View style={styles.inputFieldRow}>
            {currentUser?.avatar_url ? (
              <Image source={{ uri: currentUser.avatar_url }} style={styles.inputUserAvatar} />
            ) : (
              <View
                style={[
                  styles.inputUserAvatar,
                  { backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                  {getInitials(currentUser?.name || 'You')}
                </Text>
              </View>
            )}

            <View style={styles.inputPillContainer}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder={replyTarget ? 'Add a reply...' : 'Add a comment...'}
                placeholderTextColor="#6B7280"
                value={inputText}
                onChangeText={setInputText}
                multiline={false}
              />
            </View>

            <Pressable
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSendComment}
              disabled={!inputText.trim()}
            >
              <Send size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
