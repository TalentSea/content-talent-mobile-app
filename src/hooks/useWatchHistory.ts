import { useEffect, useState } from 'react';
import {
  getWatchHistory,
  getContinueWatchingVideos,
  subscribeWatchHistory,
  WatchHistoryItem,
} from '../services/watchHistory';
import type { ApiVideo } from '../types/video';

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>(getWatchHistory());
  const [continueWatching, setContinueWatching] = useState<ApiVideo[]>(getContinueWatchingVideos());

  useEffect(() => {
    const unsubscribe = subscribeWatchHistory(() => {
      setHistory(getWatchHistory());
      setContinueWatching(getContinueWatchingVideos());
    });
    return () => unsubscribe();
  }, []);

  return {
    history,
    continueWatching,
  };
}
