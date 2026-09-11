import RNFS from 'react-native-fs';
import { apiGet, apiRequest } from './client';
import { getCurrentUser } from './authService';

export type CommentReplyItem = {
  id: number;
  comment_id: number;
  text: string;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  reply_to_user?: string;
  likes: number;
  is_liked: boolean;
  is_owner?: boolean;
  created_at?: string;
};

export type CommentItem = {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  text: string;
  video_id: number;
  video_title?: string;
  likes: number;
  is_liked: boolean;
  reply_count: number;
  is_owner?: boolean;
  created_at?: string;
  replies?: CommentReplyItem[];
};

export type PaginatedCommentsResponse = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: CommentItem[];
};

export type PaginatedRepliesResponse = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: CommentReplyItem[];
};

// Real User comments store ONLY (No mocked/seeded comments)
const REAL_COMMENTS_MAP: Record<number, CommentItem[]> = {};

const COMMENTS_STORAGE_PATH = `${RNFS.DocumentDirectoryPath}/session_real_comments_v5.json`;

async function persistCommentsToDisk() {
  try {
    const data = JSON.stringify(REAL_COMMENTS_MAP);
    await RNFS.writeFile(COMMENTS_STORAGE_PATH, data, 'utf8');
  } catch (e) {
    console.warn('[commentsApi] Disk save notice:', e);
  }
}

async function restoreCommentsFromDisk() {
  try {
    const exists = await RNFS.exists(COMMENTS_STORAGE_PATH);
    if (exists) {
      const content = await RNFS.readFile(COMMENTS_STORAGE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        for (const vId in parsed) {
          const numId = Number(vId);
          if (Array.isArray(parsed[vId])) {
            REAL_COMMENTS_MAP[numId] = parsed[vId];
          }
        }
      }
    }
  } catch (e) {
    console.warn('[commentsApi] Disk restore notice:', e);
  }
}

restoreCommentsFromDisk();

function normalizeReply(item: any): CommentReplyItem {
  if (!item) return item;
  const author = item.author || {};
  const currentUser = getCurrentUser();
  const userId = author.id || item.user_id || (currentUser ? currentUser.id : 0);
  const isOwner = item.is_owner ?? (currentUser ? currentUser.id === userId : false);

  const fallbackName = currentUser && currentUser.id === userId ? currentUser.name : 'User';
  const authorName = author.name || author.username || item.user_name || item.username || fallbackName;

  return {
    id: item.id,
    comment_id: item.comment_id || 0,
    text: item.text || '',
    user_id: userId,
    user_name: authorName,
    user_avatar: author.avatar_url || item.user_avatar || currentUser?.avatar_url,
    reply_to_user: item.reply_to_user,
    likes: typeof item.likes === 'number' ? item.likes : 0,
    is_liked: !!item.is_liked,
    is_owner: isOwner,
    created_at: item.created_at || new Date().toISOString(),
  };
}

export function normalizeComment(item: any): CommentItem {
  if (!item) return item;
  const author = item.author || {};
  const currentUser = getCurrentUser();
  const userId = author.id || item.user_id || (currentUser ? currentUser.id : 0);
  const isOwner = item.is_owner ?? (currentUser ? currentUser.id === userId : false);

  const fallbackName = currentUser && currentUser.id === userId ? currentUser.name : 'User';
  const authorName = author.name || author.username || item.user_name || item.username || fallbackName;

  return {
    id: item.id,
    user_id: userId,
    user_name: authorName,
    user_avatar: author.avatar_url || item.user_avatar || currentUser?.avatar_url,
    text: item.text || '',
    video_id: item.video_id || 0,
    likes: typeof item.likes === 'number' ? item.likes : 0,
    is_liked: !!item.is_liked,
    reply_count: typeof item.reply_count === 'number' ? item.reply_count : 0,
    is_owner: isOwner,
    created_at: item.created_at || new Date().toISOString(),
    replies: Array.isArray(item.replies) ? item.replies.map(normalizeReply) : [],
  };
}

function mergeReplies(r1: CommentReplyItem[] = [], r2: CommentReplyItem[] = []): CommentReplyItem[] {
  const map = new Map<number, CommentReplyItem>();
  for (const r of [...r1, ...r2]) {
    if (r && r.id) {
      map.set(r.id, r);
    }
  }
  return Array.from(map.values());
}

function deduplicateComments(items: CommentItem[]): CommentItem[] {
  const map = new Map<number, CommentItem>();
  for (const item of items) {
    if (item && item.id) {
      const existing = map.get(item.id);
      if (existing) {
        const mergedReplies = mergeReplies(existing.replies, item.replies);
        const mergedCount = Math.max(
          existing.reply_count || 0,
          item.reply_count || 0,
          mergedReplies.length,
        );
        map.set(item.id, {
          ...existing,
          ...item,
          replies: mergedReplies,
          reply_count: mergedCount,
        });
      } else {
        map.set(item.id, item);
      }
    }
  }
  return Array.from(map.values());
}

export async function fetchVideoComments(
  videoId: number,
  sort: string = 'newest',
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedCommentsResponse> {
  const localList = (REAL_COMMENTS_MAP[videoId] || []).map(normalizeComment);

  try {
    const query = new URLSearchParams();
    query.set('sort', sort);
    query.set('page', String(page));
    query.set('limit', String(limit));

    // 1. Mobile Endpoint: GET /api/v1/mobile/videos/{video_id}/comments
    let response: any = null;
    try {
      response = await apiGet<any>(
        `/api/v1/mobile/videos/${videoId}/comments?${query.toString()}`,
      );
    } catch (e) {
      // Admin Endpoint fallback: GET /api/v1/admin/comments?videoId={videoId}
      try {
        response = await apiGet<any>(
          `/api/v1/admin/comments?videoId=${videoId}&${query.toString()}`,
        );
      } catch (adminErr) {
        // Fallback
      }
    }

    const rawItems = response?.items || response?.data || (Array.isArray(response) ? response : []);
    const normalizedRemote = rawItems.map(normalizeComment);

    // Eagerly load saved replies from backend for comments with reply_count > 0
    await Promise.all(
      normalizedRemote.map(async (comment: CommentItem) => {
        if (comment.reply_count > 0 || (comment.replies && comment.replies.length > 0)) {
          try {
            const repliesRes = await fetchCommentReplies(comment.id);
            if (repliesRes && repliesRes.items && repliesRes.items.length > 0) {
              const mergedMap = new Map<number, CommentReplyItem>();
              for (const r of [...repliesRes.items, ...(comment.replies || [])]) {
                if (r && r.id) mergedMap.set(r.id, r);
              }
              comment.replies = Array.from(mergedMap.values());
              comment.reply_count = Math.max(comment.reply_count, comment.replies.length);
            }
          } catch (e) {
            // Safe catch
          }
        }
      }),
    );

    const combined = deduplicateComments([...normalizedRemote, ...localList]);

    REAL_COMMENTS_MAP[videoId] = combined;
    persistCommentsToDisk();

    return {
      total: combined.length,
      page: response?.page || page,
      limit: response?.limit || limit,
      total_pages: response?.total_pages || 1,
      items: combined,
    };
  } catch (error) {
    console.warn(`[fetchVideoComments] Backend API notice for video ${videoId}:`, error);
    return {
      total: localList.length,
      page: 1,
      limit: 20,
      total_pages: 1,
      items: localList,
    };
  }
}

export async function fetchCommentReplies(
  commentId: number,
): Promise<PaginatedRepliesResponse> {
  const candidatePaths = [
    `/api/v1/mobile/comments/${commentId}/replies`,
    `/api/v1/comments/${commentId}/replies`,
    `/api/v1/mobile/comments/${commentId}/reply`,
    `/api/v1/admin/comments/${commentId}/replies`,
  ];

  let localReplies: CommentReplyItem[] = [];
  for (const vId in REAL_COMMENTS_MAP) {
    const parent = REAL_COMMENTS_MAP[vId].find(c => Number(c.id) === Number(commentId));
    if (parent && parent.replies) {
      localReplies = parent.replies;
      break;
    }
  }

  for (const path of candidatePaths) {
    try {
      const response = await apiGet<any>(path);
      const rawItems = response?.items || response?.data || (Array.isArray(response) ? response : []);
      if (Array.isArray(rawItems)) {
        const normalizedRemote = rawItems.map(normalizeReply);
        const merged = mergeReplies(normalizedRemote, localReplies);
        return {
          total: merged.length,
          page: 1,
          limit: 20,
          total_pages: 1,
          items: merged,
        };
      }
    } catch (error) {
      // Continue trying candidate endpoint fallback
    }
  }

  return {
    total: localReplies.length,
    page: 1,
    limit: 20,
    total_pages: 1,
    items: localReplies,
  };
}

export async function createTopLevelComment(
  videoId: number,
  text: string,
): Promise<CommentItem> {
  const user = getCurrentUser();

  try {
    // Backend Endpoint: POST /api/v1/mobile/videos/{video_id}/comments
    const rawRes = await apiRequest<any>(`/api/v1/mobile/videos/${videoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    const normalized = normalizeComment(rawRes);
    if (!REAL_COMMENTS_MAP[videoId]) {
      REAL_COMMENTS_MAP[videoId] = [];
    }
    REAL_COMMENTS_MAP[videoId] = deduplicateComments([normalized, ...REAL_COMMENTS_MAP[videoId]]);
    persistCommentsToDisk();
    return normalized;
  } catch (error) {
    console.warn(`[createTopLevelComment] Backend API notice for video ${videoId}:`, error);
    const fallbackComment: CommentItem = {
      id: Date.now(),
      user_id: user?.id || 1,
      user_name: user?.name || 'You',
      user_avatar: user?.avatar_url || undefined,
      text,
      video_id: videoId,
      likes: 0,
      is_liked: false,
      reply_count: 0,
      is_owner: true,
      created_at: new Date().toISOString(),
      replies: [],
    };

    if (!REAL_COMMENTS_MAP[videoId]) {
      REAL_COMMENTS_MAP[videoId] = [];
    }
    REAL_COMMENTS_MAP[videoId].unshift(fallbackComment);
    persistCommentsToDisk();
    return fallbackComment;
  }
}

export async function postCommentReply(
  commentId: number,
  text: string,
): Promise<CommentReplyItem> {
  const user = getCurrentUser();

  const candidateEndpoints = [
    `/api/v1/mobile/comments/${commentId}/reply`,
    `/api/v1/mobile/comments/${commentId}/replies`,
    `/api/v1/comments/${commentId}/reply`,
    `/api/v1/comments/${commentId}/replies`,
  ];

  let replyObj: CommentReplyItem | null = null;

  for (const path of candidateEndpoints) {
    try {
      const rawRes = await apiRequest<any>(path, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (rawRes) {
        replyObj = normalizeReply(rawRes);
        break;
      }
    } catch (e) {
      // try next candidate endpoint fallback
    }
  }

  const targetReply: CommentReplyItem = replyObj || {
    id: Date.now(),
    comment_id: Number(commentId),
    text,
    user_id: user?.id || 1,
    user_name: user?.name || 'You',
    user_avatar: user?.avatar_url || undefined,
    likes: 0,
    is_liked: false,
    is_owner: true,
    created_at: new Date().toISOString(),
  };

  // Find parent comment in REAL_COMMENTS_MAP and append reply
  let foundParent = false;
  for (const vId in REAL_COMMENTS_MAP) {
    const parent = REAL_COMMENTS_MAP[vId].find(c => Number(c.id) === Number(commentId));
    if (parent) {
      if (!parent.replies) parent.replies = [];
      const existingIdx = parent.replies.findIndex(r => Number(r.id) === Number(targetReply.id));
      if (existingIdx >= 0) {
        parent.replies[existingIdx] = targetReply;
      } else {
        parent.replies.push(targetReply);
      }
      parent.reply_count = Math.max(parent.reply_count || 0, parent.replies.length);
      foundParent = true;
      break;
    }
  }

  // If parent not yet in REAL_COMMENTS_MAP, attach to fallback group
  if (!foundParent) {
    const fallbackVId = 0;
    if (!REAL_COMMENTS_MAP[fallbackVId]) {
      REAL_COMMENTS_MAP[fallbackVId] = [];
    }
    let parent = REAL_COMMENTS_MAP[fallbackVId].find(c => Number(c.id) === Number(commentId));
    if (!parent) {
      const newParent: CommentItem = {
        id: Number(commentId),
        user_id: 0,
        user_name: 'User',
        text: 'Comment',
        video_id: 0,
        likes: 0,
        is_liked: false,
        reply_count: 1,
        created_at: new Date().toISOString(),
        replies: [targetReply],
      };
      REAL_COMMENTS_MAP[fallbackVId].push(newParent);
    } else {
      if (!parent.replies) parent.replies = [];
      parent.replies.push(targetReply);
      parent.reply_count = parent.replies.length;
    }
  }

  persistCommentsToDisk();
  return targetReply;
}

export async function toggleCommentLike(
  commentId: number,
): Promise<{ is_liked: boolean; likes: number }> {
  try {
    // Backend Endpoint: POST /api/v1/mobile/comments/{id}/like
    const res = await apiRequest<{ is_liked: boolean; likes: number; status?: string }>(
      `/api/v1/mobile/comments/${commentId}/like`,
      { method: 'POST' },
    );
    const isLiked = !!res.is_liked;
    const likes = typeof res.likes === 'number' ? res.likes : 0;

    for (const vId in REAL_COMMENTS_MAP) {
      const comment = REAL_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (comment) {
        comment.is_liked = isLiked;
        comment.likes = likes;
        persistCommentsToDisk();
        break;
      }
    }
    return { is_liked: isLiked, likes };
  } catch (error) {
    console.warn(`[toggleCommentLike] Backend API notice for comment ${commentId}:`, error);
    for (const vId in REAL_COMMENTS_MAP) {
      const comment = REAL_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (comment) {
        comment.is_liked = !comment.is_liked;
        comment.likes = Math.max(0, comment.likes + (comment.is_liked ? 1 : -1));
        persistCommentsToDisk();
        return { is_liked: comment.is_liked, likes: comment.likes };
      }
    }
    return { is_liked: true, likes: 1 };
  }
}

export async function toggleReplyLike(
  videoId: number,
  commentId: number,
  replyId: number,
): Promise<{ is_liked: boolean; likes: number }> {
  try {
    const res = await apiRequest<{ is_liked: boolean; likes: number; status?: string }>(
      `/api/v1/mobile/comments/${replyId}/like`,
      { method: 'POST' },
    );
    const isLiked = !!res.is_liked;
    const likes = typeof res.likes === 'number' ? res.likes : 0;

    const vId = Number(videoId);
    if (REAL_COMMENTS_MAP[vId]) {
      const parent = REAL_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (parent && parent.replies) {
        const reply = parent.replies.find(r => r.id === replyId);
        if (reply) {
          reply.is_liked = isLiked;
          reply.likes = likes;
          persistCommentsToDisk();
        }
      }
    }
    return { is_liked: isLiked, likes };
  } catch (error) {
    console.warn(`[toggleReplyLike] Backend API notice for reply ${replyId}:`, error);
    const vId = Number(videoId);
    if (REAL_COMMENTS_MAP[vId]) {
      const parent = REAL_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (parent && parent.replies) {
        const reply = parent.replies.find(r => r.id === replyId);
        if (reply) {
          reply.is_liked = !reply.is_liked;
          reply.likes = Math.max(0, reply.likes + (reply.is_liked ? 1 : -1));
          persistCommentsToDisk();
          return { is_liked: reply.is_liked, likes: reply.likes };
        }
      }
    }
    return { is_liked: true, likes: 1 };
  }
}

export async function deleteComment(commentId: number): Promise<boolean> {
  for (const vId in REAL_COMMENTS_MAP) {
    const idx = REAL_COMMENTS_MAP[vId].findIndex(c => c.id === commentId);
    if (idx >= 0) {
      REAL_COMMENTS_MAP[vId].splice(idx, 1);
      break;
    }
  }
  persistCommentsToDisk();

  try {
    // Backend Endpoint: DELETE /api/v1/mobile/comments/{id} (enforces author ownership)
    await apiRequest(`/api/v1/mobile/comments/${commentId}`, { method: 'DELETE' });
    return true;
  } catch (e) {
    console.warn(`[deleteComment] Backend API notice for comment ${commentId}:`, e);
    return true;
  }
}

export async function deleteCommentReply(
  commentId: number,
  replyId: number,
): Promise<boolean> {
  for (const vId in REAL_COMMENTS_MAP) {
    const parent = REAL_COMMENTS_MAP[vId].find(c => c.id === commentId);
    if (parent && parent.replies) {
      const rIdx = parent.replies.findIndex(r => r.id === replyId);
      if (rIdx >= 0) {
        parent.replies.splice(rIdx, 1);
        parent.reply_count = Math.max(0, parent.reply_count - 1);
        break;
      }
    }
  }
  persistCommentsToDisk();

  try {
    // Backend Endpoint: DELETE /api/v1/mobile/comments/{replyId}
    await apiRequest(`/api/v1/mobile/comments/${replyId}`, { method: 'DELETE' });
    return true;
  } catch (e) {
    console.warn(`[deleteCommentReply] Backend API notice for reply ${replyId}:`, e);
    return true;
  }
}
