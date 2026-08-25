import RNFS from 'react-native-fs';
import type { ApiVideo } from '../types/video';
import {
  fetchUserLikedVideosApi,
  fetchUserSavedVideosApi,
  toggleUserLikedVideoApi,
  toggleUserSavedVideoApi,
} from './api/userActivityApi';

import { getUserStorageKey, subscribeAuthChange } from './api/authService';

function getActivityFilePath(): string {
  const userKey = getUserStorageKey();
  return `${RNFS.DocumentDirectoryPath}/user_activity_${userKey}.json`;
}

function getGlobalLikesFilePath(): string {
  return `${RNFS.DocumentDirectoryPath}/streamr_global_likes_counts.json`;
}

function getGlobalUserLikesFilePath(): string {
  return `${RNFS.DocumentDirectoryPath}/streamr_global_user_likes.json`;
}

let likedVideosStore: ApiVideo[] = [];
let savedVideosStore: ApiVideo[] = [];

let globalLikesCounts: Record<string, number> = {};
let globalUserLikesMap: Record<string, Record<string, boolean>> = {};
let isGlobalLikesLoaded = false;

const activityListeners: Set<() => void> = new Set();

function notifyActivityListeners() {
  activityListeners.forEach(fn => fn());
}

async function persistUserActivityToDisk() {
  try {
    const filePath = getActivityFilePath();
    const data = JSON.stringify({
      liked: likedVideosStore,
      saved: savedVideosStore,
    });
    await RNFS.writeFile(filePath, data, 'utf8');
  } catch (err) {
    console.warn('[userActivity] Disk save notice:', err);
  }
}

async function restoreUserActivityFromDisk() {
  try {
    const filePath = getActivityFilePath();
    const exists = await RNFS.exists(filePath);
    if (exists) {
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content);
      likedVideosStore = parsed && Array.isArray(parsed.liked) ? parsed.liked : [];
      savedVideosStore = parsed && Array.isArray(parsed.saved) ? parsed.saved : [];
      notifyActivityListeners();
      return;
    }
    likedVideosStore = [];
    savedVideosStore = [];
    notifyActivityListeners();
  } catch (err) {
    console.warn('[userActivity] Disk restore notice:', err);
    likedVideosStore = [];
    savedVideosStore = [];
    notifyActivityListeners();
  }
}

function getOneTimeResetFlagPath(): string {
  return `${RNFS.DocumentDirectoryPath}/streamr_one_time_reset_flag_v10.json`;
}

async function initGlobalLikesStore() {
  if (isGlobalLikesLoaded) return;
  try {
    const flagPath = getOneTimeResetFlagPath();
    const gPath = getGlobalLikesFilePath();
    const uPath = getGlobalUserLikesFilePath();

    const hasResetBefore = await RNFS.exists(flagPath);

    if (!hasResetBefore) {
      // ONE-TIME RESET ONLY: Purge old legacy likes cache once so user starts on a clean slate
      globalLikesCounts = {};
      globalUserLikesMap = {};
      likedVideosStore = [];
      savedVideosStore = [];
      if (await RNFS.exists(gPath)) await RNFS.unlink(gPath);
      if (await RNFS.exists(uPath)) await RNFS.unlink(uPath);
      await RNFS.writeFile(flagPath, 'true', 'utf8');
    } else {
      // Normal operation: Load saved state from disk
      if (await RNFS.exists(gPath)) {
        const content = await RNFS.readFile(gPath, 'utf8');
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null) {
          globalLikesCounts = { ...parsed };
        }
      }

      if (await RNFS.exists(uPath)) {
        const content = await RNFS.readFile(uPath, 'utf8');
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null) {
          globalUserLikesMap = { ...parsed };
        }
      }
    }
  } catch (e) {
    console.warn('[userActivity] Global likes restore notice:', e);
  } finally {
    isGlobalLikesLoaded = true;
  }
}

async function saveGlobalLikesToDisk() {
  try {
    const gPath = getGlobalLikesFilePath();
    const uPath = getGlobalUserLikesFilePath();
    await RNFS.writeFile(gPath, JSON.stringify(globalLikesCounts), 'utf8');
    await RNFS.writeFile(uPath, JSON.stringify(globalUserLikesMap), 'utf8');
  } catch (err) {
    console.warn('[userActivity] Global likes save notice:', err);
  }
}

export async function syncUserActivityWithBackend() {
  await initGlobalLikesStore();
  await restoreUserActivityFromDisk();

  try {
    const [likedRes, savedRes] = await Promise.allSettled([
      fetchUserLikedVideosApi(),
      fetchUserSavedVideosApi(),
    ]);

    if (likedRes.status === 'fulfilled' && likedRes.value) {
      const userKey = getUserStorageKey();
      const backendItems = likedRes.value.items || [];
      if (backendItems.length === 0) {
        likedVideosStore = [];
      } else {
        likedVideosStore = backendItems;
        for (const video of backendItems) {
          const key = String(video.id);
          if (!globalUserLikesMap[key]) globalUserLikesMap[key] = {};
          globalUserLikesMap[key][userKey] = true;
        }
      }
    }

    if (savedRes.status === 'fulfilled' && savedRes.value?.items && savedRes.value.items.length > 0) {
      for (const video of savedRes.value.items) {
        if (!savedVideosStore.some(v => v.id === video.id)) {
          savedVideosStore.push(video);
        }
      }
    }

    notifyActivityListeners();
    persistUserActivityToDisk();
    saveGlobalLikesToDisk();
  } catch (err) {
    console.warn('[userActivity] Backend sync notice:', err);
  }
}

// Initial restoration on startup & listener on user login/logout switch
syncUserActivityWithBackend();
subscribeAuthChange(async () => {
  await syncUserActivityWithBackend();
  notifyActivityListeners();
});

export function subscribeUserActivity(listener: () => void): () => void {
  activityListeners.add(listener);
  return () => {
    activityListeners.delete(listener);
  };
}

export function setBackendLikesCount(videoId: number | string, count: number): void {
  if (!videoId) return;
  const key = String(videoId);
  const current = globalLikesCounts[key] || 0;
  if (count > current) {
    globalLikesCounts[key] = count;
    saveGlobalLikesToDisk();
    notifyActivityListeners();
  }
}

export function getCleanLikesCountForVideo(videoId: number | string): number {
  if (!videoId) return 0;
  const key = String(videoId);
  return globalLikesCounts[key] || 0;
}

export function isVideoLiked(videoId: number | string): boolean {
  if (!videoId) return false;
  const key = String(videoId);
  const userKey = getUserStorageKey();
  if (globalUserLikesMap[key] && globalUserLikesMap[key][userKey] !== undefined) {
    return !!globalUserLikesMap[key][userKey];
  }
  return likedVideosStore.some(v => String(v.id) === key);
}

const pendingLikeTogglesMap: Map<number, any> = new Map();

export function toggleLikeVideo(video: ApiVideo): boolean {
  const key = String(video.id);
  const userKey = getUserStorageKey();
  const currentlyLiked = isVideoLiked(video.id);
  let isNowLiked = false;

  if (!globalUserLikesMap[key]) {
    globalUserLikesMap[key] = {};
  }

  if (currentlyLiked) {
    globalUserLikesMap[key][userKey] = false;
    isNowLiked = false;
    globalLikesCounts[key] = Math.max(0, (globalLikesCounts[key] || 1) - 1);
    const storeIdx = likedVideosStore.findIndex(v => String(v.id) === key);
    if (storeIdx >= 0) {
      likedVideosStore.splice(storeIdx, 1);
    }
  } else {
    globalUserLikesMap[key][userKey] = true;
    isNowLiked = true;
    globalLikesCounts[key] = (globalLikesCounts[key] || 0) + 1;
    if (!likedVideosStore.some(v => String(v.id) === key)) {
      likedVideosStore.unshift(video);
    }
  }

  saveGlobalLikesToDisk();
  notifyActivityListeners();
  persistUserActivityToDisk();

  // Clear any existing pending API toggle timer for this video ID
  if (pendingLikeTogglesMap.has(video.id)) {
    clearTimeout(pendingLikeTogglesMap.get(video.id));
  }

  // Debounce API call by 300ms to safely collapse rapid clicks into 1 API request
  const timer = setTimeout(() => {
    pendingLikeTogglesMap.delete(video.id);
    toggleUserLikedVideoApi(video.id, isNowLiked).catch(err =>
      console.warn('[toggleLikeVideo] API toggle notice:', err),
    );
  }, 300);

  pendingLikeTogglesMap.set(video.id, timer);

  return isNowLiked;
}

export function isVideoSaved(videoId: number): boolean {
  return savedVideosStore.some(v => v.id === videoId);
}

export function toggleSaveVideo(video: ApiVideo): boolean {
  const index = savedVideosStore.findIndex(v => v.id === video.id);
  let isNowSaved = false;

  if (index >= 0) {
    savedVideosStore.splice(index, 1);
    isNowSaved = false;
  } else {
    savedVideosStore.unshift(video);
    isNowSaved = true;
  }

  notifyActivityListeners();
  persistUserActivityToDisk();

  toggleUserSavedVideoApi(video.id).catch(err =>
    console.warn('[toggleSaveVideo] API toggle notice:', err),
  );

  return isNowSaved;
}

export function getLikedVideos(availableVideos?: ApiVideo[]): ApiVideo[] {
  const userLiked = likedVideosStore.filter(v => isVideoLiked(v.id));
  if (availableVideos && availableVideos.length > 0) {
    const availableIds = new Set(availableVideos.map(v => v.id));
    return userLiked.filter(v => availableIds.has(v.id));
  }
  return [...userLiked];
}

export function getSavedVideos(availableVideos?: ApiVideo[]): ApiVideo[] {
  if (availableVideos && availableVideos.length > 0) {
    const availableIds = new Set(availableVideos.map(v => v.id));
    return savedVideosStore.filter(v => availableIds.has(v.id));
  }
  return [...savedVideosStore];
}

export async function resetAllVideoLikesToZero(): Promise<void> {
  globalLikesCounts = {};
  globalUserLikesMap = {};
  likedVideosStore = [];

  try {
    const gPath = getGlobalLikesFilePath();
    const uPath = getGlobalUserLikesFilePath();

    if (await RNFS.exists(gPath)) {
      await RNFS.unlink(gPath);
    }
    if (await RNFS.exists(uPath)) {
      await RNFS.unlink(uPath);
    }
  } catch (err) {
    console.warn('[userActivity] resetAllVideoLikesToZero notice:', err);
  }

  notifyActivityListeners();
}

