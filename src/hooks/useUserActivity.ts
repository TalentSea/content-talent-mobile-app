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
    let mounted = true;
    const update = () => {
      if (!mounted) return;
      const nextLiked = getLikedVideos();
      const nextSaved = getSavedVideos();

      setLikedVideos(prev => {
        if (prev.length === nextLiked.length && prev.every((v, i) => v.id === nextLiked[i]?.id)) {
          return prev;
        }
        return nextLiked;
      });

      setSavedVideos(prev => {
        if (prev.length === nextSaved.length && prev.every((v, i) => v.id === nextSaved[i]?.id)) {
          return prev;
        }
        return nextSaved;
      });
    };
    update();
    const unsubscribe = subscribeUserActivity(update);
    return () => {
      mounted = false;
      unsubscribe();
    };
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
