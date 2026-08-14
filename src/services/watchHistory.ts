import RNFS from 'react-native-fs';
import type { ApiVideo } from '../types/video';
import {
  recordUserWatchHistoryApi,
  fetchUserWatchHistoryApi,
  fetchUserContinueWatchingApi,
  clearUserWatchHistoryApi,
  removeVideoWatchHistoryApi,
} from './api/userActivityApi';

import { getUserStorageKey, subscribeAuthChange } from './api/authService';

export type WatchHistoryItem = {
  video: ApiVideo;
  watchedAt: string;
  progressPercentage: number;
  lastPositionSeconds?: number;
};

function getHistoryFilePath(): string {
  const userKey = getUserStorageKey();
  return `${RNFS.DocumentDirectoryPath}/watch_history_${userKey}.json`;
}

// Clean memory-backed watch history store restored from disk and backend API
let watchHistoryStore: WatchHistoryItem[] = [];

const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

async function persistWatchHistoryToDisk() {
  try {
    const filePath = getHistoryFilePath();
    const data = JSON.stringify(watchHistoryStore);
    await RNFS.writeFile(filePath, data, 'utf8');
  } catch (err) {
    console.warn('[watchHistory] Disk save notice:', err);
  }
}

async function restoreWatchHistoryFromDisk() {
  try {
    const filePath = getHistoryFilePath();
    const exists = await RNFS.exists(filePath);
    if (exists) {
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        watchHistoryStore = parsed;
        notifyListeners();
        return;
      }
    }
    watchHistoryStore = [];
    notifyListeners();
  } catch (err) {
    console.warn('[watchHistory] Disk restore notice:', err);
    watchHistoryStore = [];
    notifyListeners();
  }
}

export async function syncWatchHistoryWithBackend() {
  await restoreWatchHistoryFromDisk();

  try {
    const [historyRes, continueRes] = await Promise.allSettled([
      fetchUserWatchHistoryApi(),
      fetchUserContinueWatchingApi(),
    ]);

    const combinedItems: ApiVideo[] = [];

    if (historyRes.status === 'fulfilled' && historyRes.value?.items) {
      combinedItems.push(...historyRes.value.items);
    }
    if (continueRes.status === 'fulfilled' && continueRes.value?.items) {
      combinedItems.push(...continueRes.value.items);
    }

    if (combinedItems.length > 0) {
      for (const video of combinedItems) {
        const existingIndex = watchHistoryStore.findIndex(item => item.video.id === video.id);
        if (existingIndex < 0) {
          watchHistoryStore.push({
            video,
            watchedAt: video.published_at || new Date().toISOString(),
            progressPercentage: (video as any).progress_percentage || (video as any).watch_progress || 45,
            lastPositionSeconds: (video as any).last_position_seconds || (video as any).progress_seconds || 120,
          });
        }
      }
      notifyListeners();
      persistWatchHistoryToDisk();
    }
  } catch (err) {
    console.warn('[syncWatchHistoryWithBackend] Backend sync notice:', err);
  }
}

export function recordWatchHistory(
  video: ApiVideo,
  progressPercentage: number = 50,
  lastPositionSeconds: number = 120,
) {
  if (!video || !video.id) return;

  const existingIndex = watchHistoryStore.findIndex(item => item.video.id === video.id);

  const historyItem: WatchHistoryItem = {
    video,
    watchedAt: new Date().toISOString(),
    progressPercentage: Math.min(100, Math.max(1, progressPercentage)),
    lastPositionSeconds,
  };

  if (existingIndex >= 0) {
    watchHistoryStore.splice(existingIndex, 1);
  }

  watchHistoryStore.unshift(historyItem);
  notifyListeners();
  persistWatchHistoryToDisk();

  // Send watch progress to backend via POST /api/v1/mobile/videos/{video_id}/progress
  recordUserWatchHistoryApi(video.id, progressPercentage, lastPositionSeconds).catch(err =>
    console.warn('[recordWatchHistory] Backend progress sync notice:', err),
  );
}

export function getWatchHistory(availableVideos?: ApiVideo[]): WatchHistoryItem[] {
  if (!availableVideos || availableVideos.length === 0) {
    return [...watchHistoryStore];
  }
  const availableIds = new Set(availableVideos.map(v => v.id));
  return watchHistoryStore.filter(item => availableIds.has(item.video.id));
}

export function getContinueWatchingVideos(availableVideos?: ApiVideo[]): ApiVideo[] {
  if (!availableVideos || availableVideos.length === 0) {
    return watchHistoryStore.map(item => item.video);
  }
  const availableIds = new Set(availableVideos.map(v => v.id));
  return watchHistoryStore
    .filter(item => availableIds.has(item.video.id))
    .map(item => item.video);
}

export function cleanUnavailableWatchHistory(availableVideos: ApiVideo[]) {
  if (!availableVideos || availableVideos.length === 0) return;
  const availableIds = new Set(availableVideos.map(v => v.id));
  const prevCount = watchHistoryStore.length;
  watchHistoryStore = watchHistoryStore.filter(item => availableIds.has(item.video.id));
  if (watchHistoryStore.length !== prevCount) {
    notifyListeners();
    persistWatchHistoryToDisk();
  }
}

export function clearWatchHistory() {
  watchHistoryStore = [];
  notifyListeners();
  persistWatchHistoryToDisk();
  clearUserWatchHistoryApi().catch(err =>
    console.warn('[clearWatchHistory] Backend clear history notice:', err),
  );
}

export function removeWatchHistoryItem(videoId: number) {
  const index = watchHistoryStore.findIndex(item => item.video.id === videoId);
  if (index >= 0) {
    watchHistoryStore.splice(index, 1);
    notifyListeners();
    persistWatchHistoryToDisk();
  }
  removeVideoWatchHistoryApi(videoId).catch(err =>
    console.warn(`[removeWatchHistoryItem] Backend delete item notice for video ${videoId}:`, err),
  );
}

export function subscribeWatchHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Initial sync on startup & listener on user login/logout switch
syncWatchHistoryWithBackend();
subscribeAuthChange(() => syncWatchHistoryWithBackend());
