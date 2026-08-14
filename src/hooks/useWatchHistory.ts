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
    let mounted = true;
    const update = () => {
      if (!mounted) return;
      const nextHistory = getWatchHistory();
      setHistory(prev => {
        if (
          prev.length === nextHistory.length &&
          prev.every(
            (item, idx) =>
              item.video.id === nextHistory[idx]?.video?.id &&
              item.progressPercentage === nextHistory[idx]?.progressPercentage,
          )
        ) {
          return prev;
        }
        return nextHistory;
      });
    };
    update();
    const unsubscribe = subscribeWatchHistory(update);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const availableIdsKey = (availableVideos || []).map(v => v.id).join(',');

  const filteredHistory = useMemo(() => {
    if (!availableVideos || availableVideos.length === 0) return history;
    const availableIds = new Set(availableVideos.map(v => v.id));
    return history.filter(item => availableIds.has(item.video.id));
  }, [history, availableIdsKey]);

  const filteredContinueWatching = useMemo(() => {
    const videoMap = new Map((availableVideos || []).map(v => [v.id, v]));
    return filteredHistory.map(item => {
      const latest = videoMap.get(item.video.id);
      return latest ? { ...item.video, ...latest } : item.video;
    });
  }, [filteredHistory, availableIdsKey]);

  return {
    history: filteredHistory,
    continueWatching: filteredContinueWatching,
    removeWatchHistoryItem,
    clearWatchHistory,
  };
}
