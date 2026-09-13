import { useEffect, useMemo, useState } from 'react';
import {
  getLikedVideos,
  getSavedVideos,
  isVideoLiked,
  isVideoSaved,
  subscribeUserActivity,
  toggleLikeVideo,
  toggleSaveVideo,
  isPlaylistSaved,
  toggleSavePlaylist,
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
    const videoMap = new Map(availableVideos.map(v => [v.id, v]));
    return likedVideos
      .filter(v => videoMap.has(v.id))
      .map(v => ({ ...v, ...videoMap.get(v.id) }));
  }, [likedVideos, availableIdsKey]);

  const filteredSavedVideos = useMemo(() => {
    if (!availableVideos || availableVideos.length === 0) return savedVideos;
    const videoMap = new Map(availableVideos.map(v => [v.id, v]));
    return savedVideos
      .filter(v => videoMap.has(v.id))
      .map(v => ({ ...v, ...videoMap.get(v.id) }));
  }, [savedVideos, availableIdsKey]);

  return {
    likedVideos: filteredLikedVideos,
    savedVideos: filteredSavedVideos,
    isVideoLiked,
    isVideoSaved,
    toggleLikeVideo,
    toggleSaveVideo,
    isPlaylistSaved,
    toggleSavePlaylist,
  };
}
