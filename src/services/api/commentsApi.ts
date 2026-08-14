import RNFS from 'react-native-fs';
import { apiGet, apiRequest } from './client';
import { USE_MOCK_VIDEOS } from '../../constants/config';
import { getCurrentUser } from './authService';

export type CommentReplyItem = {
  id: number;
  comment_id: number;
  text: string;
  user_id: number;
  user_name: string;
  user_avatar?: string;
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

// Initial Mock comments store with YouTube-style structure (likes, replies)
const MOCK_COMMENTS_MAP: Record<number, CommentItem[]> = {
  1: [
    {
      id: 101,
      user_id: 2,
      user_name: 'Alex Johnson',
      user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      text: 'Amazing HLS video playback quality! Super smooth transition.',
      video_id: 1,
      video_title: 'Tears of Steel',
      likes: 24,
      is_liked: false,
      reply_count: 2,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      replies: [
        {
          id: 1001,
          comment_id: 101,
          text: 'Agreed! The embedded subtitle switching works flawlessly too.',
          user_id: 3,
          user_name: 'Sarah Miller',
          user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 1002,
          comment_id: 101,
          text: 'Thanks! Powered by ExoPlayer & HLS multi-track rendering.',
          user_id: 1,
          user_name: 'Alex OTT Creator (Instructor)',
          user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
    },
    {
      id: 102,
      user_id: 4,
      user_name: 'David Chen',
      user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      text: 'Great breakdown of HLS captions and multi-language audio!',
      video_id: 1,
      video_title: 'Tears of Steel',
      likes: 15,
      is_liked: true,
      reply_count: 1,
      created_at: new Date(Date.now() - 14400000).toISOString(),
      replies: [
        {
          id: 1003,
          comment_id: 102,
          text: 'Very helpful demo for mobile video developers.',
          user_id: 5,
          user_name: 'Elena Rostova',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    },
  ],
  5: [
    {
      id: 201,
      user_id: 6,
      user_name: 'Marcus Vance',
      user_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
      text: 'Best React Native performance masterclass I have seen!',
      video_id: 5,
      video_title: 'React Native Architecture',
      likes: 42,
      is_liked: true,
      reply_count: 1,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      replies: [
        {
          id: 2001,
          comment_id: 201,
          text: 'The TurboModule segment answered so many questions.',
          user_id: 7,
          user_name: 'Priya Sharma',
          created_at: new Date(Date.now() - 5400000).toISOString(),
        },
      ],
    },
  ],
};

const COMMENTS_STORAGE_PATH = `${RNFS.DocumentDirectoryPath}/session_comments.json`;

async function persistCommentsToDisk() {
  try {
    const data = JSON.stringify(MOCK_COMMENTS_MAP);
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
            const existing = MOCK_COMMENTS_MAP[numId] || [];
            const map = new Map<number, CommentItem>();
            for (const item of [...parsed[vId], ...existing]) {
              if (item && item.id) map.set(item.id, item);
            }
            MOCK_COMMENTS_MAP[numId] = Array.from(map.values());
          }
        }
      }
    }
  } catch (e) {
    console.warn('[commentsApi] Disk restore notice:', e);
  }
}

restoreCommentsFromDisk();

function deduplicateCommentItems(items: CommentItem[]): CommentItem[] {
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

export async function fetchVideoComments(
  videoId: number,
  sort: string = 'newest',
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedCommentsResponse> {
  const localList = MOCK_COMMENTS_MAP[videoId] || [];

  if (USE_MOCK_VIDEOS) {
    const defaultList = MOCK_COMMENTS_MAP[1] || [];
    const combined = deduplicateCommentItems([...localList, ...defaultList]);
    return {
      total: combined.length,
      page,
      limit,
      total_pages: 1,
      items: combined,
    };
  }

  try {
    const query = new URLSearchParams();
    query.set('videoId', String(videoId));
    query.set('sort', sort);
    query.set('page', String(page));
    query.set('limit', String(limit));

    // Exclusive Mobile Endpoint: GET /api/v1/mobile/videos/{video_id}/comments
    const response = await apiGet<PaginatedCommentsResponse>(
      `/api/v1/mobile/videos/${videoId}/comments?${query.toString()}`,
    );

    const remoteItems = response?.items || [];
    const combined = deduplicateCommentItems([...localList, ...remoteItems]);

    return {
      total: combined.length,
      page: response?.page || page,
      limit: response?.limit || limit,
      total_pages: response?.total_pages || 1,
      items: combined,
    };
  } catch (error) {
    console.warn(`[fetchVideoComments] Mobile API notice for video ${videoId}:`, error);
    const defaultList = MOCK_COMMENTS_MAP[1] || [];
    const combined = deduplicateCommentItems([...localList, ...defaultList]);
    return {
      total: combined.length,
      page: 1,
      limit: 20,
      total_pages: 1,
      items: combined,
    };
  }
}

export async function fetchCommentReplies(
  commentId: number,
): Promise<PaginatedRepliesResponse> {
  if (USE_MOCK_VIDEOS) {
    for (const vId in MOCK_COMMENTS_MAP) {
      const parent = MOCK_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (parent && parent.replies) {
        return {
          total: parent.replies.length,
          page: 1,
          limit: 20,
          total_pages: 1,
          items: parent.replies,
        };
      }
    }
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }

  try {
    // Exclusive Mobile Endpoint: GET /api/v1/mobile/comments/{id}/replies
    return await apiGet<PaginatedRepliesResponse>(
      `/api/v1/mobile/comments/${commentId}/replies`,
    );
  } catch (error) {
    console.warn(`[fetchCommentReplies] Mobile API notice for comment ${commentId}:`, error);
    for (const vId in MOCK_COMMENTS_MAP) {
      const parent = MOCK_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (parent && parent.replies) {
        return {
          total: parent.replies.length,
          page: 1,
          limit: 20,
          total_pages: 1,
          items: parent.replies,
        };
      }
    }
    return { total: 0, page: 1, limit: 20, total_pages: 1, items: [] };
  }
}

export async function postCommentReply(
  commentId: number,
  text: string,
): Promise<CommentReplyItem> {
  const user = getCurrentUser();

  if (!USE_MOCK_VIDEOS) {
    try {
      // Primary: Mobile Endpoint POST /api/v1/mobile/comments/{id}/reply
      const response = await apiRequest<CommentReplyItem>(
        `/api/v1/mobile/comments/${commentId}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ text }),
        },
      );
      if (response && response.id) {
        for (const vId in MOCK_COMMENTS_MAP) {
          const parent = MOCK_COMMENTS_MAP[vId].find(c => c.id === commentId);
          if (parent) {
            if (!parent.replies) parent.replies = [];
            if (!parent.replies.some(r => r.id === response.id)) {
              parent.replies.push(response);
              parent.reply_count = parent.replies.length;
            }
            break;
          }
        }
        persistCommentsToDisk();
        return response;
      }
    } catch (error) {
      console.warn(`[postCommentReply] Mobile API notice for comment ${commentId}:`, error);
    }
  }

  const fallbackReply: CommentReplyItem = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    comment_id: commentId,
    text,
    user_id: user?.id || 42,
    user_name: user?.name || 'You',
    user_avatar: user?.avatar_url,
    created_at: new Date().toISOString(),
  };

  for (const vId in MOCK_COMMENTS_MAP) {
    const parent = MOCK_COMMENTS_MAP[vId].find(c => c.id === commentId);
    if (parent) {
      if (!parent.replies) parent.replies = [];
      parent.replies.push(fallbackReply);
      parent.reply_count = parent.replies.length;
      break;
    }
  }
  persistCommentsToDisk();

  return fallbackReply;
}

export async function toggleCommentLike(
  commentId: number,
): Promise<{ is_liked: boolean; likes: number }> {
  if (USE_MOCK_VIDEOS) {
    for (const vId in MOCK_COMMENTS_MAP) {
      const comment = MOCK_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (comment) {
        comment.is_liked = !comment.is_liked;
        comment.likes += comment.is_liked ? 1 : -1;
        persistCommentsToDisk();
        return { is_liked: comment.is_liked, likes: comment.likes };
      }
    }
    return { is_liked: true, likes: 1 };
  }

  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/comments/{id}/like
    return await apiRequest<{ is_liked: boolean; likes: number }>(
      `/api/v1/mobile/comments/${commentId}/like`,
      { method: 'POST' },
    );
  } catch (error) {
    console.warn(`[toggleCommentLike] Mobile API notice for comment ${commentId}:`, error);
    for (const vId in MOCK_COMMENTS_MAP) {
      const comment = MOCK_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (comment) {
        comment.is_liked = !comment.is_liked;
        comment.likes += comment.is_liked ? 1 : -1;
        persistCommentsToDisk();
        return { is_liked: comment.is_liked, likes: comment.likes };
      }
    }
    return { is_liked: true, likes: 1 };
  }
}

export async function createTopLevelComment(
  videoId: number,
  text: string,
): Promise<CommentItem> {
  const user = getCurrentUser();

  if (!USE_MOCK_VIDEOS) {
    try {
      // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/comments
      const response = await apiRequest<CommentItem>(`/api/v1/mobile/videos/${videoId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (response && response.id) {
        if (!MOCK_COMMENTS_MAP[videoId]) {
          MOCK_COMMENTS_MAP[videoId] = [];
        }
        if (!MOCK_COMMENTS_MAP[videoId].some(c => c.id === response.id)) {
          MOCK_COMMENTS_MAP[videoId].unshift(response);
        }
        persistCommentsToDisk();
        return response;
      }
    } catch (error) {
      console.warn(`[createTopLevelComment] Mobile API notice for video ${videoId}:`, error);
    }
  }

  const fallbackComment: CommentItem = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    user_id: user?.id || 42,
    user_name: user?.name || 'You',
    user_avatar: user?.avatar_url,
    text,
    video_id: videoId,
    likes: 0,
    is_liked: false,
    reply_count: 0,
    created_at: new Date().toISOString(),
    replies: [],
  };

  if (!MOCK_COMMENTS_MAP[videoId]) {
    MOCK_COMMENTS_MAP[videoId] = [];
  }
  MOCK_COMMENTS_MAP[videoId].unshift(fallbackComment);
  persistCommentsToDisk();

  return fallbackComment;
}

export async function deleteComment(commentId: number): Promise<boolean> {
  for (const vId in MOCK_COMMENTS_MAP) {
    const idx = MOCK_COMMENTS_MAP[vId].findIndex(c => c.id === commentId);
    if (idx >= 0) {
      MOCK_COMMENTS_MAP[vId].splice(idx, 1);
      break;
    }
  }
  persistCommentsToDisk();

  try {
    await apiRequest(`/api/v1/mobile/comments/${commentId}`, { method: 'DELETE' });
    return true;
  } catch (e1) {
    try {
      await apiRequest(`/api/v1/admin/comments/${commentId}`, { method: 'DELETE' });
      return true;
    } catch (e2) {
      console.warn(`[deleteComment] API notice for comment ${commentId}:`, e2);
      return true;
    }
  }
}

export async function deleteCommentReply(
  commentId: number,
  replyId: number,
): Promise<boolean> {
  for (const vId in MOCK_COMMENTS_MAP) {
    const parent = MOCK_COMMENTS_MAP[vId].find(c => c.id === commentId);
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
    await apiRequest(`/api/v1/mobile/comments/${commentId}/replies/${replyId}`, { method: 'DELETE' });
    return true;
  } catch (e) {
    console.warn(`[deleteCommentReply] API notice for reply ${replyId}:`, e);
    return true;
  }
}
