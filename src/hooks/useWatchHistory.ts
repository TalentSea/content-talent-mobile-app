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
    const started = history.filter(item => (item.progressPercentage ?? 0) > 0);
    if (!availableVideos || availableVideos.length === 0) return started;
    const availableIds = new Set(availableVideos.map(v => v.id));
    return started.filter(item => availableIds.has(item.video.id));
  }, [history, availableIdsKey]);

  const filteredContinueWatching = useMemo(() => {
    const videoMap = new Map((availableVideos || []).map(v => [v.id, v]));
    const incomplete = history.filter(
      item => (item.progressPercentage ?? 0) > 0 && (item.progressPercentage ?? 0) < 98,
    );
    if (!availableVideos || availableVideos.length === 0) {
      return incomplete.map(item => item.video);
    }
    return incomplete
      .filter(item => videoMap.has(item.video.id))
      .map(item => {
        const latest = videoMap.get(item.video.id);
        return latest ? { ...item.video, ...latest } : item.video;
      });
  }, [history, availableIdsKey]);

  return {
    history: filteredHistory,
    continueWatching: filteredContinueWatching,
    removeWatchHistoryItem,
    clearWatchHistory,
  };
}
