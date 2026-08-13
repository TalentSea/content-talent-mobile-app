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

let likedVideosStore: ApiVideo[] = [];
let savedVideosStore: ApiVideo[] = [];

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

export async function syncUserActivityWithBackend() {
  await restoreUserActivityFromDisk();

  try {
    const [likedRes, savedRes] = await Promise.allSettled([
      fetchUserLikedVideosApi(),
      fetchUserSavedVideosApi(),
    ]);

    if (likedRes.status === 'fulfilled' && likedRes.value?.items && likedRes.value.items.length > 0) {
      for (const video of likedRes.value.items) {
        if (!likedVideosStore.some(v => v.id === video.id)) {
          likedVideosStore.push(video);
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
  } catch (err) {
    console.warn('[userActivity] Backend sync notice:', err);
  }
}

// Initial restoration on startup & listener on user login/logout switch
syncUserActivityWithBackend();
subscribeAuthChange(() => syncUserActivityWithBackend());

export function subscribeUserActivity(listener: () => void): () => void {
  activityListeners.add(listener);
  return () => {
    activityListeners.delete(listener);
  };
}

export function isVideoLiked(videoId: number): boolean {
  return likedVideosStore.some(v => v.id === videoId);
}

export function toggleLikeVideo(video: ApiVideo): boolean {
  const index = likedVideosStore.findIndex(v => v.id === video.id);
  let isNowLiked = false;

  if (index >= 0) {
    likedVideosStore.splice(index, 1);
    isNowLiked = false;
  } else {
    likedVideosStore.unshift(video);
    isNowLiked = true;
  }

  notifyActivityListeners();
  persistUserActivityToDisk();

  toggleUserLikedVideoApi(video.id).catch(err =>
    console.warn('[toggleLikeVideo] API toggle notice:', err),
  );

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
  if (availableVideos && availableVideos.length > 0) {
    const availableIds = new Set(availableVideos.map(v => v.id));
    return likedVideosStore.filter(v => availableIds.has(v.id));
  }
  return [...likedVideosStore];
}

export function getSavedVideos(availableVideos?: ApiVideo[]): ApiVideo[] {
  if (availableVideos && availableVideos.length > 0) {
    const availableIds = new Set(availableVideos.map(v => v.id));
    return savedVideosStore.filter(v => availableIds.has(v.id));
  }
  return [...savedVideosStore];
}
