import { useEffect, useMemo, useState } from 'react';
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

export function useUserActivity(availableVideos: ApiVideo[] = []) {
  const [likedVideos, setLikedVideos] = useState<ApiVideo[]>(getLikedVideos);
  const [savedVideos, setSavedVideos] = useState<ApiVideo[]>(getSavedVideos);

  useEffect(() => {
    const update = () => {
      setLikedVideos(getLikedVideos());
      setSavedVideos(getSavedVideos());
    };
    const unsubscribe = subscribeUserActivity(update);
    return () => unsubscribe();
  }, []);

  const availableIdsKey = (availableVideos || []).map(v => v.id).join(',');

  const filteredLikedVideos = useMemo(() => {
    if (!availableVideos || availableVideos.length === 0) return likedVideos;
    const availableIds = new Set(availableVideos.map(v => v.id));
    return likedVideos.filter(v => availableIds.has(v.id));
  }, [likedVideos, availableIdsKey]);

  const filteredSavedVideos = useMemo(() => {
    if (!availableVideos || availableVideos.length === 0) return savedVideos;
    const availableIds = new Set(availableVideos.map(v => v.id));
    return savedVideos.filter(v => availableIds.has(v.id));
  }, [savedVideos, availableIdsKey]);

  return {
    likedVideos: filteredLikedVideos,
    savedVideos: filteredSavedVideos,
    isVideoLiked,
    isVideoSaved,
    toggleLikeVideo,
    toggleSaveVideo,
  };
}
