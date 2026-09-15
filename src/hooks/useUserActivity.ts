import { useEffect, useState } from 'react';
import {
  getLikedVideos,
  getSavedVideos,
  isVideoLiked,
  isVideoSaved,
  subscribeUserActivity,
  toggleLikeVideo,
  toggleSaveVideo,
} from '../services/userActivity';
import type { ApiVideo } from '../types/video';

export function useUserActivity() {
  const [likedVideos, setLikedVideos] = useState<ApiVideo[]>(getLikedVideos());
  const [savedVideos, setSavedVideos] = useState<ApiVideo[]>(getSavedVideos());

  useEffect(() => {
    const unsubscribe = subscribeUserActivity(() => {
      setLikedVideos(getLikedVideos());
      setSavedVideos(getSavedVideos());
    });
    return () => unsubscribe();
  }, []);

  return {
    likedVideos,
    savedVideos,
    isVideoLiked,
    isVideoSaved,
    toggleLikeVideo,
    toggleSaveVideo,
  };
}
