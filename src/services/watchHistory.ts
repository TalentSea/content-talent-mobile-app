import RNFS from 'react-native-fs';
import type { ApiVideo } from '../types/video';
import {
  recordUserWatchHistoryApi,
  fetchUserWatchHistoryApi,
  fetchUserContinueWatchingApi,
  clearUserWatchHistoryApi,
  removeVideoWatchHistoryApi,
  incrementVideoViewsApi,
} from './api/userActivityApi';

import { getUserStorageKey, subscribeAuthChange } from './api/authService';

export type WatchHistoryItem = {
  video: ApiVideo;
  watchedAt: string;
  progressPercentage: number;
  lastPositionSeconds?: number;
};

function getLegacyHistoryFilePath(): string {
  const userKey = getUserStorageKey();
  return `${RNFS.DocumentDirectoryPath}/watch_history_${userKey}.json`;
}

// Clean any leftover legacy watch history file from local disk
async function purgeLegacyDiskWatchHistory() {
  try {
    const filePath = getLegacyHistoryFilePath();
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
    }
  } catch {
    // Ignore cleanup notice
  }
}

// Strictly in-memory store — watch history is NEVER saved to local disk
let watchHistoryStore: WatchHistoryItem[] = [];

const listeners: Set<() => void> = new Set();
const viewTriggeredSet = new Set<number>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export async function syncWatchHistoryWithBackend() {
  // Purge any legacy disk files so only downloads remain on device disk
  await purgeLegacyDiskWatchHistory();

  try {
    const [historyRes, continueRes] = await Promise.allSettled([
      fetchUserWatchHistoryApi(),
      fetchUserContinueWatchingApi(),
    ]);

    const remoteItems: ApiVideo[] = [];

    if (historyRes.status === 'fulfilled' && historyRes.value?.items) {
      remoteItems.push(...historyRes.value.items);
    }
    if (continueRes.status === 'fulfilled' && continueRes.value?.items) {
      remoteItems.push(...continueRes.value.items);
    }

    if (remoteItems.length > 0) {
      for (const video of remoteItems) {
        const prog = (video as any).progress_percentage ?? (video as any).watch_progress ?? 100;
        const pos = (video as any).last_position_seconds ?? (video as any).progress_seconds ?? 0;

        if (prog > 0) {
          const existingIndex = watchHistoryStore.findIndex(item => item.video.id === video.id);
          if (existingIndex < 0) {
            watchHistoryStore.push({
              video,
              watchedAt: video.published_at || new Date().toISOString(),
              progressPercentage: prog,
              lastPositionSeconds: pos,
            });
          } else {
            watchHistoryStore[existingIndex].progressPercentage = prog;
            watchHistoryStore[existingIndex].lastPositionSeconds = pos;
          }
        }
      }
      notifyListeners();
    }
  } catch (err) {
    console.warn('[syncWatchHistoryWithBackend] Backend sync notice:', err);
  }
}

const lastBackendProgressSyncMap = new Map<number, { timestamp: number; progress: number }>();

export function recordWatchHistory(
  video: ApiVideo,
  progressPercentage: number = 0,
  lastPositionSeconds: number = 0,
) {
  if (!video || !video.id) return;

  // Unwatched (0%) videos must NEVER be recorded in History or Continue Watching
  if (progressPercentage <= 0) {
    return;
  }

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

  // Throttle backend API calls: every 10 seconds during continuous playback, on seek jump (>= 3%), or completion (>= 95%)
  const now = Date.now();
  const lastSync = lastBackendProgressSyncMap.get(video.id);
  const shouldSyncBackend =
    !lastSync ||
    now - lastSync.timestamp >= 10000 ||
    Math.abs(progressPercentage - lastSync.progress) >= 3 ||
    progressPercentage >= 95;

  if (shouldSyncBackend) {
    lastBackendProgressSyncMap.set(video.id, { timestamp: now, progress: progressPercentage });
    recordUserWatchHistoryApi(video.id, progressPercentage, lastPositionSeconds)
      .then(() => {
        // Spec: When progress crosses 30% watch threshold, trigger view count registration
        if (progressPercentage >= 30 && !viewTriggeredSet.has(video.id)) {
          viewTriggeredSet.add(video.id);
          incrementVideoViewsApi(video.id).catch(err =>
            console.warn(`[recordWatchHistory] 30% view increment notice for video ${video.id}:`, err),
          );
        }
      })
      .catch(err => console.warn('[recordWatchHistory] Backend progress sync notice:', err));
  }
}

/**
 * Immediately flushes the latest watch progress to backend on lifecycle events
 * (player pause, seek release, app backgrounding, screen exit)
 */
export function flushWatchProgressNow(
  video: ApiVideo,
  progressPercentage: number = 0,
  lastPositionSeconds: number = 0,
) {
  if (!video || !video.id) return;
  const now = Date.now();
  lastBackendProgressSyncMap.set(video.id, { timestamp: now, progress: progressPercentage });
  recordUserWatchHistoryApi(video.id, progressPercentage, lastPositionSeconds).catch(err =>
    console.warn('[flushWatchProgressNow] Backend progress notice:', err),
  );
}

// History contains EVERY video the user started watching (> 0%), whether completed (100%) or stopped midway (< 98%)
export function getWatchHistory(availableVideos?: ApiVideo[]): WatchHistoryItem[] {
  const startedItems = watchHistoryStore.filter(item => (item.progressPercentage ?? 0) > 0);
  if (!availableVideos || availableVideos.length === 0) {
    return startedItems;
  }
  const availableIds = new Set(availableVideos.map(v => v.id));
  return startedItems.filter(item => availableIds.has(item.video.id));
}

// Continue Watching contains ONLY videos that were started (> 0%) but NOT completed (< 98%)
export function getContinueWatchingVideos(availableVideos?: ApiVideo[]): ApiVideo[] {
  const activeItems = watchHistoryStore.filter(
    item => (item.progressPercentage ?? 0) > 0 && (item.progressPercentage ?? 0) < 98,
  );

  if (!availableVideos || availableVideos.length === 0) {
    return activeItems.map(item => item.video);
  }
  const availableIds = new Set(availableVideos.map(v => v.id));
  return activeItems
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
  }
}

export function clearWatchHistory() {
  watchHistoryStore = [];
  notifyListeners();
  purgeLegacyDiskWatchHistory();
  clearUserWatchHistoryApi().catch(err =>
    console.warn('[clearWatchHistory] Backend clear history notice:', err),
  );
}

export function removeWatchHistoryItem(videoId: number) {
  const index = watchHistoryStore.findIndex(item => item.video.id === videoId);
  if (index >= 0) {
    watchHistoryStore.splice(index, 1);
    notifyListeners();
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
