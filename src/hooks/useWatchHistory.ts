import { useEffect, useMemo, useState } from 'react';
import {
  getWatchHistory,
  subscribeWatchHistory,
  removeWatchHistoryItem,
  clearWatchHistory,
  WatchHistoryItem,
} from '../services/watchHistory';
import type { ApiVideo } from '../types/video';

export function useWatchHistory(availableVideos: ApiVideo[] = []) {
  const [history, setHistory] = useState<WatchHistoryItem[]>(getWatchHistory);

  useEffect(() => {
    const update = () => {
      setHistory(getWatchHistory());
    };
    const unsubscribe = subscribeWatchHistory(update);
    return () => unsubscribe();
  }, []);

  const availableIdsKey = (availableVideos || []).map(v => v.id).join(',');

  const filteredHistory = useMemo(() => {
    if (!availableVideos || availableVideos.length === 0) return history;
    const availableIds = new Set(availableVideos.map(v => v.id));
    return history.filter(item => availableIds.has(item.video.id));
  }, [history, availableIdsKey]);

  const filteredContinueWatching = useMemo(() => {
    return filteredHistory.map(item => item.video);
  }, [filteredHistory]);

  return {
    history: filteredHistory,
    continueWatching: filteredContinueWatching,
    removeWatchHistoryItem,
    clearWatchHistory,
  };
}
