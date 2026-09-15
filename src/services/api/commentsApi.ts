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

export async function fetchVideoComments(
  videoId: number,
  sort: string = 'newest',
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedCommentsResponse> {
  if (USE_MOCK_VIDEOS) {
    const list = MOCK_COMMENTS_MAP[videoId] || MOCK_COMMENTS_MAP[1] || [];
    return {
      total: list.length,
      page,
      limit,
      total_pages: 1,
      items: list,
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

    if (!response || !response.items) {
      const list = MOCK_COMMENTS_MAP[videoId] || MOCK_COMMENTS_MAP[1] || [];
      return { total: list.length, page: 1, limit: 20, total_pages: 1, items: list };
    }

    return response;
  } catch (error) {
    console.warn(`[fetchVideoComments] Mobile API notice for video ${videoId}:`, error);
    const list = MOCK_COMMENTS_MAP[videoId] || MOCK_COMMENTS_MAP[1] || [];
    return {
      total: list.length,
      page: 1,
      limit: 20,
      total_pages: 1,
      items: list,
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

  if (USE_MOCK_VIDEOS) {
    const newReply: CommentReplyItem = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      comment_id: commentId,
      text,
      user_id: user?.id || 42,
      user_name: user?.name || 'User',
      user_avatar: user?.avatar_url,
      created_at: new Date().toISOString(),
    };

    for (const vId in MOCK_COMMENTS_MAP) {
      const parent = MOCK_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newReply);
        parent.reply_count += 1;
        break;
      }
    }

    return newReply;
  }

  try {
    // Exclusive Mobile Endpoint: POST /api/v1/mobile/comments/{id}/reply
    const response = await apiRequest<CommentReplyItem>(
      `/api/v1/mobile/comments/${commentId}/reply`,
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      },
    );
    return response;
  } catch (error) {
    console.warn(`[postCommentReply] Mobile API notice for comment ${commentId}:`, error);
    const newReply: CommentReplyItem = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      comment_id: commentId,
      text,
      user_id: user?.id || 42,
      user_name: user?.name || 'User',
      user_avatar: user?.avatar_url,
      created_at: new Date().toISOString(),
    };

    for (const vId in MOCK_COMMENTS_MAP) {
      const parent = MOCK_COMMENTS_MAP[vId].find(c => c.id === commentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newReply);
        parent.reply_count += 1;
        break;
      }
    }

    return newReply;
  }
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

  const newComment: CommentItem = {
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
  MOCK_COMMENTS_MAP[videoId].unshift(newComment);

  if (!USE_MOCK_VIDEOS) {
    try {
      // Exclusive Mobile Endpoint: POST /api/v1/mobile/videos/{video_id}/comments
      const response = await apiRequest<CommentItem>(`/api/v1/mobile/videos/${videoId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (response && response.id) {
        return response;
      }
    } catch (error) {
      console.warn(`[createTopLevelComment] Mobile API notice for video ${videoId}:`, error);
    }
  }

  return newComment;
}
