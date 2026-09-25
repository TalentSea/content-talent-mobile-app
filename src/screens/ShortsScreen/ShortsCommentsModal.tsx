import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  X,
  Send,
  Heart,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react-native';
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
import { formatLikes, getRelativeTimeString } from '../../utils/timeUtils';

type ShortsCommentsModalProps = {
  visible: boolean;
  shortId: number | null;
  onClose: () => void;
  onCommentCountUpdate?: (shortId: number, newCount: number) => void;
};

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const clean = name.replace(/^@/, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

export function ShortsCommentsModal({
  visible,
  shortId,
  onClose,
  onCommentCountUpdate,
}: ShortsCommentsModalProps) {
  const currentUser = getCurrentUser();
  const inputRef = useRef<TextInput>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{
    commentId: number;
    userName: string;
  } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (visible && shortId) {
      loadComments(shortId);
    } else {
      setComments([]);
      setReplyTarget(null);
      setInputText('');
      setExpandedReplies({});
    }
  }, [visible, shortId]);

  const loadComments = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetchVideoComments(id);
      if (res && Array.isArray(res.items)) {
        setComments(res.items);
        if (onCommentCountUpdate) {
          onCommentCountUpdate(id, res.total || res.items.length);
        }
      }
    } catch (err) {
      console.warn('[ShortsCommentsModal] Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!shortId || !inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    try {
      if (replyTarget) {
        const commentId = replyTarget.commentId;
        const newReply = await postCommentReply(commentId, textToSend);
        setReplyTarget(null);

        setComments(prev =>
          prev.map(c => {
            if (c.id === commentId) {
              const prevReplies = c.replies || [];
              return {
                ...c,
                reply_count: (c.reply_count || prevReplies.length) + 1,
                replies: [...prevReplies, newReply],
              };
            }
            return c;
          })
        );
        setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
      } else {
        const newComment = await createTopLevelComment(shortId, textToSend);
        setComments(prev => [newComment, ...prev]);

        const nextTotal = comments.length + 1;
        if (onCommentCountUpdate) {
          onCommentCountUpdate(shortId, nextTotal);
        }
      }
    } catch (err) {
      console.warn('[ShortsCommentsModal] Error submitting comment:', err);
    }
  };

  const handleToggleCommentLike = async (comment: CommentItem) => {
    const nextLiked = !comment.is_liked;
    const nextCount = nextLiked
      ? (comment.likes || 0) + 1
      : Math.max(0, (comment.likes || 0) - 1);

    setComments(prev =>
      prev.map(c =>
        c.id === comment.id
          ? { ...c, is_liked: nextLiked, likes: nextCount }
          : c
      )
    );

    try {
      const res = await toggleCommentLike(comment.id);
      if (res) {
        setComments(prev =>
          prev.map(c =>
            c.id === comment.id
              ? {
                  ...c,
                  is_liked: res.is_liked,
                  likes: res.likes ?? nextCount,
                }
              : c
          )
        );
      }
    } catch (err) {
      console.warn('[ShortsCommentsModal] Error toggling comment like:', err);
    }
  };

  const handleToggleReplyLike = async (commentId: number, reply: CommentReplyItem) => {
    const nextLiked = !reply.is_liked;
    const nextCount = nextLiked
      ? (reply.likes || 0) + 1
      : Math.max(0, (reply.likes || 0) - 1);

    setComments(prev =>
      prev.map(c => {
        if (c.id !== commentId) return c;
        const updatedReplies = (c.replies || []).map(r =>
          r.id === reply.id
            ? { ...r, is_liked: nextLiked, likes: nextCount }
            : r
        );
        return { ...c, replies: updatedReplies };
      })
    );

    try {
      const res = await toggleReplyLike(shortId || 1, commentId, reply.id);
      if (res) {
        setComments(prev =>
          prev.map(c => {
            if (c.id !== commentId) return c;
            const updatedReplies = (c.replies || []).map(r =>
              r.id === reply.id
                ? {
                    ...r,
                    is_liked: res.is_liked,
                    likes: res.likes ?? nextCount,
                  }
                : r
            );
            return { ...c, replies: updatedReplies };
          })
        );
      }
    } catch (err) {
      console.warn('[ShortsCommentsModal] Error toggling reply like:', err);
    }
  };

  const handleToggleExpandReplies = async (commentId: number) => {
    const isExpanded = !expandedReplies[commentId];
    setExpandedReplies(prev => ({ ...prev, [commentId]: isExpanded }));

    if (isExpanded) {
      const targetComment = comments.find(c => c.id === commentId);
      if (targetComment && (!targetComment.replies || targetComment.replies.length === 0)) {
        try {
          const res = await fetchCommentReplies(commentId);
          if (res && Array.isArray(res.items)) {
            setComments(prev =>
              prev.map(c =>
                c.id === commentId ? { ...c, replies: res.items } : c
              )
            );
          }
        } catch (err) {
          console.warn('[ShortsCommentsModal] Error fetching replies:', err);
        }
      }
    }
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setComments(prev => prev.filter(c => c.id !== commentId));
          if (shortId && onCommentCountUpdate) {
            onCommentCountUpdate(shortId, Math.max(0, comments.length - 1));
          }
          await deleteComment(commentId);
        },
      },
    ]);
  };

  const handleDeleteReply = (commentId: number, replyId: number) => {
    Alert.alert('Delete Reply', 'Are you sure you want to delete this reply?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setComments(prev =>
            prev.map(c => {
              if (c.id !== commentId) return c;
              const nextReplies = (c.replies || []).filter(r => r.id !== replyId);
              return {
                ...c,
                reply_count: Math.max(0, (c.reply_count || 1) - 1),
                replies: nextReplies,
              };
            })
          );
          await deleteCommentReply(commentId, replyId);
        },
      },
    ]);
  };

  const totalCount = comments.reduce(
    (acc, curr) => acc + 1 + (curr.reply_count || curr.replies?.length || 0),
    0
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.backdrop}>
        <Pressable style={modalStyles.dismissArea} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={modalStyles.sheetContainer}
        >
          {/* Sheet Handle */}
          <View style={modalStyles.handleBar} />

          {/* Header */}
          <View style={modalStyles.headerRow}>
            <View style={modalStyles.titleGroup}>
              <Text style={modalStyles.headerTitle}>Comments</Text>
              <View style={modalStyles.countPill}>
                <Text style={modalStyles.countPillText}>{totalCount}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={modalStyles.closeButton} hitSlop={10}>
              <X size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Comments List */}
          {loading ? (
            <View style={modalStyles.centerContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={modalStyles.emptySubText}>Loading comments...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={modalStyles.centerContainer}>
              <Text style={modalStyles.emptyTitle}>No comments yet</Text>
              <Text style={modalStyles.emptySubText}>
                Be the first to share your thoughts on this Short!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => String(item.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={modalStyles.listContent}
              renderItem={({ item: comment }) => {
                const isMyComment =
                  currentUser?.id &&
                  String(comment.user_id) === String(currentUser.id);
                const hasReplies =
                  (comment.reply_count && comment.reply_count > 0) ||
                  (comment.replies && comment.replies.length > 0);
                const isRepliesOpen = expandedReplies[comment.id];
                const repliesList = comment.replies || [];

                return (
                  <View style={modalStyles.commentItem}>
                    {/* Avatar */}
                    {comment.user_avatar ? (
                      <Image
                        source={{ uri: comment.user_avatar }}
                        style={modalStyles.avatarImage}
                      />
                    ) : (
                      <View style={modalStyles.avatarFallback}>
                        <Text style={modalStyles.avatarFallbackText}>
                          {getInitials(comment.user_name)}
                        </Text>
                      </View>
                    )}

                    {/* Main Content */}
                    <View style={modalStyles.commentBody}>
                      <View style={modalStyles.commentHeaderRow}>
                        <Text style={modalStyles.userNameText}>
                          {comment.user_name || 'Viewer'}
                        </Text>
                        <Text style={modalStyles.timeText}>
                          {getRelativeTimeString(comment.created_at)}
                        </Text>
                      </View>

                      <Text style={modalStyles.commentText}>{comment.text}</Text>

                      {/* Action buttons (Like, Reply, Delete) */}
                      <View style={modalStyles.commentActionsRow}>
                        <Pressable
                          style={modalStyles.actionTouch}
                          onPress={() => handleToggleCommentLike(comment)}
                        >
                          <Heart
                            size={14}
                            color={comment.is_liked ? '#EF4444' : '#94A3B8'}
                            fill={comment.is_liked ? '#EF4444' : 'transparent'}
                          />
                          {(comment.likes || 0) > 0 && (
                            <Text
                              style={[
                                modalStyles.actionCountText,
                                comment.is_liked && { color: '#EF4444' },
                              ]}
                            >
                              {formatLikes(comment.likes || 0)}
                            </Text>
                          )}
                        </Pressable>

                        <Pressable
                          style={modalStyles.actionTouch}
                          onPress={() => {
                            setReplyTarget({
                              commentId: comment.id,
                              userName: comment.user_name || 'User',
                            });
                            inputRef.current?.focus();
                          }}
                        >
                          <Text style={modalStyles.replyBtnText}>Reply</Text>
                        </Pressable>

                        {isMyComment && (
                          <Pressable
                            style={modalStyles.actionTouch}
                            onPress={() => handleDeleteComment(comment.id)}
                            hitSlop={8}
                          >
                            <Trash2 size={13} color="#64748B" />
                          </Pressable>
                        )}
                      </View>

                      {/* Threaded Replies Toggle */}
                      {hasReplies && (
                        <Pressable
                          style={modalStyles.viewRepliesBtn}
                          onPress={() => handleToggleExpandReplies(comment.id)}
                        >
                          <View style={modalStyles.replyLineBar} />
                          <Text style={modalStyles.viewRepliesText}>
                            {isRepliesOpen
                              ? 'Hide replies'
                              : `View ${comment.reply_count || repliesList.length} ${
                                  (comment.reply_count || repliesList.length) === 1
                                    ? 'reply'
                                    : 'replies'
                                }`}
                          </Text>
                          {isRepliesOpen ? (
                            <ChevronUp size={14} color="#818CF8" />
                          ) : (
                            <ChevronDown size={14} color="#818CF8" />
                          )}
                        </Pressable>
                      )}

                      {/* Threaded Replies List */}
                      {isRepliesOpen && repliesList.length > 0 && (
                        <View style={modalStyles.repliesList}>
                          {repliesList.map(reply => {
                            const isMyReply =
                              currentUser?.id &&
                              String(reply.user_id) === String(currentUser.id);

                            return (
                              <View key={reply.id} style={modalStyles.replyItem}>
                                {reply.user_avatar ? (
                                  <Image
                                    source={{ uri: reply.user_avatar }}
                                    style={modalStyles.replyAvatarImage}
                                  />
                                ) : (
                                  <View style={modalStyles.replyAvatarFallback}>
                                    <Text style={modalStyles.replyAvatarText}>
                                      {getInitials(reply.user_name)}
                                    </Text>
                                  </View>
                                )}

                                <View style={modalStyles.commentBody}>
                                  <View style={modalStyles.commentHeaderRow}>
                                    <Text style={modalStyles.userNameText}>
                                      {reply.user_name || 'Viewer'}
                                    </Text>
                                    <Text style={modalStyles.timeText}>
                                      {getRelativeTimeString(reply.created_at)}
                                    </Text>
                                  </View>

                                  <Text style={modalStyles.commentText}>{reply.text}</Text>

                                  <View style={modalStyles.commentActionsRow}>
                                    <Pressable
                                      style={modalStyles.actionTouch}
                                      onPress={() =>
                                        handleToggleReplyLike(comment.id, reply)
                                      }
                                    >
                                      <Heart
                                        size={13}
                                        color={reply.is_liked ? '#EF4444' : '#94A3B8'}
                                        fill={reply.is_liked ? '#EF4444' : 'transparent'}
                                      />
                                      {(reply.likes || 0) > 0 && (
                                        <Text
                                          style={[
                                            modalStyles.actionCountText,
                                            reply.is_liked && { color: '#EF4444' },
                                          ]}
                                        >
                                          {formatLikes(reply.likes || 0)}
                                        </Text>
                                      )}
                                    </Pressable>

                                    <Pressable
                                      style={modalStyles.actionTouch}
                                      onPress={() => {
                                        setReplyTarget({
                                          commentId: comment.id,
                                          userName: reply.user_name || 'User',
                                        });
                                        inputRef.current?.focus();
                                      }}
                                    >
                                      <Text style={modalStyles.replyBtnText}>Reply</Text>
                                    </Pressable>

                                    {isMyReply && (
                                      <Pressable
                                        style={modalStyles.actionTouch}
                                        onPress={() =>
                                          handleDeleteReply(comment.id, reply.id)
                                        }
                                        hitSlop={8}
                                      >
                                        <Trash2 size={12} color="#64748B" />
                                      </Pressable>
                                    )}
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Bottom Dock Input */}
          <View style={modalStyles.dockWrapper}>
            {replyTarget && (
              <View style={modalStyles.replyTargetBar}>
                <Text style={modalStyles.replyTargetText}>
                  Replying to @{replyTarget.userName}
                </Text>
                <Pressable
                  onPress={() => setReplyTarget(null)}
                  hitSlop={6}
                >
                  <X size={15} color="#94A3B8" />
                </Pressable>
              </View>
            )}

            <View style={modalStyles.inputBarRow}>
              {currentUser?.avatar_url ? (
                <Image
                  source={{ uri: currentUser.avatar_url }}
                  style={modalStyles.dockAvatar}
                />
              ) : (
                <View style={modalStyles.dockAvatarFallback}>
                  <Text style={modalStyles.dockAvatarText}>
                    {getInitials(currentUser?.name || 'You')}
                  </Text>
                </View>
              )}

              <TextInput
                ref={inputRef}
                style={modalStyles.inputField}
                placeholder={
                  replyTarget
                    ? `Reply to @${replyTarget.userName}...`
                    : 'Add a comment...'
                }
                placeholderTextColor="#64748B"
                value={inputText}
                onChangeText={setInputText}
                multiline={false}
              />

              <Pressable
                style={[
                  modalStyles.sendButton,
                  !inputText.trim() && modalStyles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Send size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '75%',
    minHeight: '45%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 20,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  countPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  commentBody: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  userNameText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    color: '#64748B',
    fontSize: 11,
  },
  commentText: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  commentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  actionCountText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  replyBtnText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },
  viewRepliesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  replyLineBar: {
    width: 20,
    height: 1,
    backgroundColor: '#334155',
  },
  viewRepliesText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700',
  },
  repliesList: {
    marginTop: 10,
    paddingLeft: 4,
    borderLeftWidth: 1.5,
    borderLeftColor: '#1E293B',
  },
  replyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 10,
  },
  replyAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
  },
  replyAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  dockWrapper: {
    backgroundColor: '#0A0F1D',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  replyTargetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyTargetText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '600',
  },
  inputBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dockAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  dockAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  inputField: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 14,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
});
