import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import {
  ThumbsUp,
  Heart,
  Send,
  X,
  MoreVertical,
  ChevronDown,
  ChevronUp,
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
import { fetchMobileBrandingApi } from '../../services/api/brandingApi';
import { formatLikes } from '../../utils/timeUtils';
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
  const clean = name.replace(/^@/, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '3 days ago';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '3 days ago';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} days ago`;
    const diffWk = Math.floor(diffDay / 7);
    return `${diffWk} ${diffWk === 1 ? 'week' : 'weeks'} ago`;
  } catch (e) {
    return '3 days ago';
  }
}

function isCreatorUser(
  userName?: string,
  isCreatorFlag?: boolean,
  currentCreatorName?: string,
): boolean {
  if (isCreatorFlag) return true;
  if (!userName) return false;
  const lower = userName.toLowerCase();
  if (
    lower.includes('creator') ||
    lower.includes('admin') ||
    lower.includes('gabriel') ||
    lower.includes('koviri') ||
    lower.includes('tech labs') ||
    lower.includes('techlabs') ||
    lower === '@taediariies'
  ) {
    return true;
  }
  if (currentCreatorName && currentCreatorName !== 'Creator') {
    const cleanCurrent = currentCreatorName.replace(/^@/, '').toLowerCase();
    const cleanUser = lower.replace(/^@/, '');
    if (cleanUser === cleanCurrent || cleanUser.includes(cleanCurrent)) {
      return true;
    }
  }
  return false;
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

  const [creatorName, setCreatorName] = useState<string>('Creator');
  const [creatorLogo, setCreatorLogo] = useState<string | null>(null);

  // Track expanded replies per comment ID
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [commentsRes, brandingRes] = await Promise.allSettled([
          fetchVideoComments(videoId),
          fetchMobileBrandingApi(),
        ]);

        if (!isMounted) return;

        if (brandingRes.status === 'fulfilled' && brandingRes.value) {
          const branding = brandingRes.value;
          const studioName = branding.studio_name || branding.creator_name;
          if (studioName) {
            setCreatorName(studioName);
          }
          if (branding.logo_url) {
            setCreatorLogo(branding.logo_url);
          }
        }

        if (commentsRes.status === 'fulfilled' && commentsRes.value?.items) {
          setComments(deduplicateComments(commentsRes.value.items));
        }
      } catch (err) {
        console.warn('[CommentsSection] Error loading comments data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
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
        prev.map(c =>
          c.id === commentId
            ? { ...c, is_liked: res.is_liked, likes: res.likes }
            : c,
        ),
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
                r.id === replyId
                  ? { ...r, is_liked: res.is_liked, likes: res.likes }
                  : r,
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

  function promptCommentOptions(comment: CommentItem) {
    const isOwner = comment.is_owner || (currentUser && currentUser.id === comment.user_id);

    const buttons: any[] = [
      { text: 'Cancel', style: 'cancel' },
    ];

    if (isOwner) {
      buttons.push({
        text: 'Delete Comment',
        style: 'destructive',
        onPress: async () => {
          try {
            setComments(prev => prev.filter(c => c.id !== comment.id));
            await deleteComment(comment.id);
          } catch (err) {
            console.warn('[CommentsSection] Error deleting comment:', err);
          }
        },
      });
    } else {
      buttons.push({
        text: 'Report Comment',
        onPress: () => Alert.alert('Reported', 'Thank you for keeping our community safe.'),
      });
    }

    Alert.alert('Comment Options', comment.text.substring(0, 40) + '...', buttons);
  }

  function promptReplyOptions(commentId: number, reply: CommentReplyItem) {
    const isOwner = reply.is_owner || (currentUser && currentUser.id === reply.user_id);

    const buttons: any[] = [
      { text: 'Cancel', style: 'cancel' },
    ];

    if (isOwner) {
      buttons.push({
        text: 'Delete Reply',
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
      });
    } else {
      buttons.push({
        text: 'Report Reply',
        onPress: () => Alert.alert('Reported', 'Thank you for keeping our community safe.'),
      });
    }

    Alert.alert('Reply Options', reply.text.substring(0, 40) + '...', buttons);
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
          const rawReplies = comment.replies || [];
          const replyCount = Math.max(comment.reply_count || 0, rawReplies.length);
          const hasRepliesShow = replyCount > 0;

          const isCreatorComment = isCreatorUser(
            comment.user_name,
            (comment as any).is_creator,
            creatorName,
          );

          const commentAuthorAvatar = isCreatorComment && creatorLogo ? creatorLogo : comment.user_avatar;
          const commentAuthorName = isCreatorComment && creatorName && creatorName !== 'Creator'
            ? (creatorName.startsWith('@') ? creatorName : `@${creatorName}`)
            : (comment.user_name.startsWith('@') ? comment.user_name : `@${comment.user_name}`);

          // Pinned / Creator Replies at Top
          const repliesList = [...rawReplies].sort((a, b) => {
            const aIsCreator = isCreatorUser(a.user_name, (a as any).is_creator, creatorName);
            const bIsCreator = isCreatorUser(b.user_name, (b as any).is_creator, creatorName);
            if (aIsCreator && !bIsCreator) return -1;
            if (!aIsCreator && bIsCreator) return 1;
            return 0;
          });

          // Creator logo_url for heart badge, replies button, or creator avatar
          const creatorAvatarUri = creatorLogo || comment.creator_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80';

          return (
            <View key={`comment-${comment.id}-${idx}`} style={styles.commentCard}>
              {/* Left Column: Avatar + Thread Connecting Line */}
              <View style={styles.leftColumn}>
                {commentAuthorAvatar ? (
                  <Image source={{ uri: commentAuthorAvatar }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center' },
                    ]}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                      {getInitials(commentAuthorName)}
                    </Text>
                  </View>
                )}

                {/* Vertical thread connecting line linking comment to replies */}
                {(hasRepliesShow || repliesList.length > 0) ? (
                  <View style={styles.threadLine} />
                ) : null}
              </View>

              {/* Main Content Column */}
              <View style={styles.commentMain}>
                {/* Header Row: @userhandle · time · 3-dots options */}
                <View style={styles.authorHeader}>
                  <View style={styles.authorInfoRow}>
                    {isCreatorComment ? (
                      <View style={styles.creatorPillBadge}>
                        <Text style={styles.creatorPillText}>{commentAuthorName}</Text>
                      </View>
                    ) : (
                      <Text style={styles.authorName}>{commentAuthorName}</Text>
                    )}
                    <Text style={styles.timeText}>{formatRelativeTime(comment.created_at)}</Text>
                  </View>

                  <Pressable
                    onPress={() => promptCommentOptions(comment)}
                    hitSlop={10}
                    style={styles.moreBtn}
                  >
                    <MoreVertical size={16} color="#9CA3AF" />
                  </Pressable>
                </View>

                {/* Comment Content Text */}
                <Text style={styles.commentText}>{comment.text}</Text>

                {/* Action Bar Row: ThumbsUp + Count | Creator Heart Badge | Reply */}
                <View style={styles.actionRow}>
                  {/* Like Button */}
                  <Pressable
                    style={styles.actionIconButton}
                    onPress={() => handleToggleLikeComment(comment.id)}
                    hitSlop={8}
                  >
                    <ThumbsUp
                      size={15}
                      color={comment.is_liked ? '#38BDF8' : '#9CA3AF'}
                      fill={comment.is_liked ? '#38BDF8' : 'transparent'}
                    />
                    {comment.likes > 0 ? (
                      <Text style={[styles.actionCountText, comment.is_liked ? { color: '#38BDF8' } : null]}>
                        {formatLikes(comment.likes)}
                      </Text>
                    ) : null}
                  </Pressable>

                  {/* Creator Heart Badge (logo_url + Red Heart Overlay) */}
                  {comment.is_hearted_by_creator || comment.creator_avatar ? (
                    <View style={styles.creatorHeartContainer}>
                      <Image
                        source={{ uri: creatorAvatarUri }}
                        style={styles.creatorAvatar}
                      />
                      <View style={styles.creatorHeartBadge}>
                        <Heart size={6} color="#FFFFFF" fill="#FFFFFF" />
                      </View>
                    </View>
                  ) : null}

                  {/* Reply Text Button */}
                  <Pressable onPress={() => startReply(comment.id, comment.user_name)} hitSlop={8}>
                    <Text style={styles.replyBtnText}>Reply</Text>
                  </Pressable>
                </View>

                {/* Expandable Replies Thread Button ("logo_url X replies v") */}
                {hasRepliesShow && (
                  <Pressable
                    style={styles.toggleRepliesBtn}
                    onPress={() => handleToggleExpandReplies(comment.id)}
                  >
                    {/* Creator logo_url on Left of Replies Button */}
                    <Image
                      source={{ uri: creatorAvatarUri }}
                      style={styles.miniReplyAvatar}
                    />

                    <Text style={styles.toggleRepliesText}>
                      {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                    </Text>

                    {isExpanded ? (
                      <ChevronUp size={14} color="#F3F4F6" />
                    ) : (
                      <ChevronDown size={14} color="#F3F4F6" />
                    )}
                  </Pressable>
                )}

                {/* Nested Threaded Replies List (Creator reply pinned at top) */}
                {isExpanded && repliesList.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {repliesList.map((reply, rIdx) => {
                      const words = (reply.text || '').split(' ');
                      const hasMention = words[0]?.startsWith('@');
                      const mentionTag = hasMention ? words[0] : null;
                      const replyBody = hasMention ? words.slice(1).join(' ') : reply.text;
                      const isCreatorReply = isCreatorUser(
                        reply.user_name,
                        (reply as any).is_creator,
                        creatorName,
                      );
                      const replyAvatarUri = isCreatorReply ? creatorAvatarUri : reply.user_avatar;
                      const replyDisplayName = isCreatorReply
                        ? (creatorName && creatorName !== 'Creator' ? (creatorName.startsWith('@') ? creatorName : `@${creatorName}`) : (reply.user_name.startsWith('@') ? reply.user_name : `@${reply.user_name}`))
                        : (reply.user_name.startsWith('@') ? reply.user_name : `@${reply.user_name}`);

                      return (
                        <View key={`reply-${reply.id}-${rIdx}`} style={styles.replyCard}>
                          {/* Reply Left Avatar */}
                          <View style={styles.replyLeftColumn}>
                            {replyAvatarUri ? (
                              <Image source={{ uri: replyAvatarUri }} style={styles.replyAvatar} />
                            ) : (
                              <View
                                style={[
                                  styles.replyAvatar,
                                  { backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
                                ]}
                              >
                                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                                  {getInitials(reply.user_name)}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Reply Content Column */}
                          <View style={styles.replyMain}>
                            <View style={styles.authorHeader}>
                              <View style={styles.authorInfoRow}>
                                {isCreatorReply ? (
                                  <View style={styles.creatorPillBadge}>
                                    <Text style={styles.creatorPillText}>
                                      {replyDisplayName}
                                    </Text>
                                  </View>
                                ) : (
                                  <Text style={styles.replyAuthorName}>
                                    {replyDisplayName}
                                  </Text>
                                )}
                                <Text style={styles.timeText}>{formatRelativeTime(reply.created_at)}</Text>
                              </View>

                              <Pressable
                                onPress={() => promptReplyOptions(comment.id, reply)}
                                hitSlop={8}
                                style={styles.moreBtn}
                              >
                                <MoreVertical size={14} color="#9CA3AF" />
                              </Pressable>
                            </View>

                            <Text style={styles.replyText}>
                              {mentionTag ? (
                                <Text style={styles.mentionText}>{mentionTag} </Text>
                              ) : null}
                              {replyBody}
                            </Text>

                            {/* Reply Action Bar (No dislike) */}
                            <View style={styles.actionRow}>
                              <Pressable
                                style={styles.actionIconButton}
                                onPress={() => handleToggleLikeReply(comment.id, reply.id)}
                                hitSlop={6}
                              >
                                <ThumbsUp
                                  size={14}
                                  color={reply.is_liked ? '#38BDF8' : '#9CA3AF'}
                                  fill={reply.is_liked ? '#38BDF8' : 'transparent'}
                                />
                                {reply.likes > 0 ? (
                                  <Text style={[styles.actionCountText, reply.is_liked ? { color: '#38BDF8' } : null]}>
                                    {formatLikes(reply.likes)}
                                  </Text>
                                ) : null}
                              </Pressable>

                              {reply.is_hearted_by_creator || reply.creator_avatar ? (
                                <View style={styles.creatorHeartContainer}>
                                  <Image
                                    source={{ uri: reply.creator_avatar || creatorAvatarUri }}
                                    style={styles.creatorAvatar}
                                  />
                                  <View style={styles.creatorHeartBadge}>
                                    <Heart size={6} color="#FFFFFF" fill="#FFFFFF" />
                                  </View>
                                </View>
                              ) : null}

                              <Pressable onPress={() => startReply(comment.id, reply.user_name)} hitSlop={6}>
                                <Text style={styles.replyBtnText}>Reply</Text>
                              </Pressable>
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
        })
      )}

      {/* Bottom Input Dock Container */}
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
    </View>
  );
}
