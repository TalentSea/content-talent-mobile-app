import { useEffect, useMemo, useState } from 'react';
import {
  getLikedVideos,
  getSavedVideos,
  getLikedPlaylists,
  getSavedPlaylists,
  isVideoLiked,
  isVideoSaved,
  subscribeUserActivity,
  toggleLikeVideo,
  toggleSaveVideo,
  isPlaylistLiked,
  toggleLikePlaylist,
  isPlaylistSaved,
  toggleSavePlaylist,
  PlaylistActivityItem,
} from '../services/userActivity';
import type { ApiVideo } from '../types/video';

export function useUserActivity(availableVideos: ApiVideo[] = []) {
  const [likedVideos, setLikedVideos] = useState<ApiVideo[]>(getLikedVideos);
  const [savedVideos, setSavedVideos] = useState<ApiVideo[]>(getSavedVideos);
  const [likedPlaylists, setLikedPlaylists] = useState<PlaylistActivityItem[]>(getLikedPlaylists);
  const [savedPlaylists, setSavedPlaylists] = useState<PlaylistActivityItem[]>(getSavedPlaylists);

  useEffect(() => {
    let mounted = true;
    const update = () => {
      if (!mounted) return;
      setLikedVideos(getLikedVideos());
      setSavedVideos(getSavedVideos());
      setLikedPlaylists(getLikedPlaylists());
      setSavedPlaylists(getSavedPlaylists());
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
    likedPlaylists,
    savedPlaylists,
    isVideoLiked,
    isVideoSaved,
    toggleLikeVideo,
    toggleSaveVideo,
    isPlaylistLiked,
    toggleLikePlaylist,
    isPlaylistSaved,
    toggleSavePlaylist,
  };
}
