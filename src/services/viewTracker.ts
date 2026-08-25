import RNFS from 'react-native-fs';
import { getUserStorageKey, subscribeAuthChange } from './api/authService';
import { clearUserWatchHistoryApi, incrementVideoViewsApi } from './api/userActivityApi';

function getGlobalCountsFilePath(): string {
  return `${RNFS.DocumentDirectoryPath}/streamr_global_unique_views.json`;
}

function getGlobalUserViewsFilePath(): string {
  return `${RNFS.DocumentDirectoryPath}/streamr_global_user_views.json`;
}

function getOneTimeResetFlagPath(): string {
  return `${RNFS.DocumentDirectoryPath}/streamr_one_time_reset_flag_v4.json`;
}

// Global unique view counter store: videoId (string) -> count (number)
let globalUniqueViewCounts: Record<string, number> = {};
// Global user views map: videoId (string) -> Record<userKey, boolean>
let globalUserViewsMap: Record<string, Record<string, boolean>> = {};
let isGlobalCountsLoaded = false;

export async function initViewTracker(): Promise<void> {
  if (isGlobalCountsLoaded) return;

  try {
    const flagPath = getOneTimeResetFlagPath();
    const gPath = getGlobalCountsFilePath();
    const uPath = getGlobalUserViewsFilePath();

    const hasResetBefore = await RNFS.exists(flagPath);

    if (!hasResetBefore) {
      // ONE-TIME RESET ONLY: Purge old data once so every video starts at 0 for testing
      globalUniqueViewCounts = {};
      globalUserViewsMap = {};
      if (await RNFS.exists(gPath)) await RNFS.unlink(gPath);
      if (await RNFS.exists(uPath)) await RNFS.unlink(uPath);
      await RNFS.writeFile(flagPath, JSON.stringify({ done: true, timestamp: Date.now() }), 'utf8');
    } else {
      // Normal operation: NEVER reset counts on user switch, refresh, or app launch!
      if (await RNFS.exists(gPath)) {
        const gContent = await RNFS.readFile(gPath, 'utf8');
        const gParsed = JSON.parse(gContent);
        if (typeof gParsed === 'object' && gParsed !== null) {
          globalUniqueViewCounts = { ...gParsed };
        }
      }

      if (await RNFS.exists(uPath)) {
        const uContent = await RNFS.readFile(uPath, 'utf8');
        const uParsed = JSON.parse(uContent);
        if (typeof uParsed === 'object' && uParsed !== null) {
          globalUserViewsMap = { ...uParsed };
        }
      }
    }
  } catch (e) {
    console.warn('[viewTracker] Disk restore notice:', e);
  } finally {
    isGlobalCountsLoaded = true;
  }
}

// Re-init on user auth change
subscribeAuthChange(async () => {
  await initViewTracker();
  notifyViewListeners();
});

// Initial restoration
initViewTracker();

export function hasUserViewedVideo(videoId: number | string): boolean {
  if (!videoId) return false;
  const key = String(videoId);
  const userKey = getUserStorageKey();
  return !!(globalUserViewsMap[key] && globalUserViewsMap[key][userKey]);
}

// Backward compatibility alias for hasUserViewedVideo
export function hasUserViewedVideoIn24Hours(videoId: number | string): boolean {
  return hasUserViewedVideo(videoId);
}

const viewListeners: Set<() => void> = new Set();

function notifyViewListeners() {
  viewListeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.warn('[viewTracker] Listener notice:', e);
    }
  });
}

export function subscribeViewTracker(listener: () => void): () => void {
  viewListeners.add(listener);
  return () => {
    viewListeners.delete(listener);
  };
}

export function setBackendViewCount(videoId: number | string, count: number): void {
  if (!videoId) return;
  const key = String(videoId);
  const current = globalUniqueViewCounts[key] || 0;
  if (count > current) {
    globalUniqueViewCounts[key] = count;
    saveGlobalViewsToDisk();
    notifyViewListeners();
  }
}

export function getCleanViewCountForVideo(videoId: number | string): number {
  if (!videoId) return 0;
  const key = String(videoId);
  return globalUniqueViewCounts[key] || 0;
}

async function saveGlobalViewsToDisk() {
  try {
    const gPath = getGlobalCountsFilePath();
    const uPath = getGlobalUserViewsFilePath();
    await RNFS.writeFile(gPath, JSON.stringify(globalUniqueViewCounts), 'utf8');
    await RNFS.writeFile(uPath, JSON.stringify(globalUserViewsMap), 'utf8');
  } catch (err) {
    console.warn('[viewTracker] Disk save notice:', err);
  }
}

const pendingViewIncrementsSet: Set<string> = new Set();

export function markVideoAsViewed(videoId: number | string): boolean {
  if (!videoId) return false;
  const key = String(videoId);
  const userKey = getUserStorageKey();

  if (!globalUserViewsMap[key]) {
    globalUserViewsMap[key] = {};
  }

  const alreadyViewedByUser = !!globalUserViewsMap[key][userKey];

  if (!alreadyViewedByUser) {
    globalUserViewsMap[key][userKey] = true;
    globalUniqueViewCounts[key] = (globalUniqueViewCounts[key] || 0) + 1;

    saveGlobalViewsToDisk();
    notifyViewListeners();

    incrementVideoViewsApi(Number(videoId)).catch(err =>
      console.warn('[markVideoAsViewed] API notice:', err),
    );
  }

  // Handle concurrent request lock
  if (!pendingViewIncrementsSet.has(key)) {
    pendingViewIncrementsSet.add(key);
    setTimeout(() => {
      pendingViewIncrementsSet.delete(key);
    }, 2000);
    return true;
  }

  return false;
}

export async function resetViewTracker(): Promise<void> {
  await resetAllVideoViewsToZero();
}

/**
 * Reset all existing video view counts and related view records to a clean state of 0 views.
 */
export async function resetAllVideoViewsToZero(): Promise<void> {
  globalUniqueViewCounts = {};
  globalUserViewsMap = {};

  try {
    const gPath = getGlobalCountsFilePath();
    const uPath = getGlobalUserViewsFilePath();

    if (await RNFS.exists(gPath)) {
      await RNFS.unlink(gPath);
    }
    if (await RNFS.exists(uPath)) {
      await RNFS.unlink(uPath);
    }

    // Clear backend watch history feed
    await clearUserWatchHistoryApi();
  } catch (err) {
    console.warn('[viewTracker] resetAllVideoViewsToZero notice:', err);
  }

  notifyViewListeners();
}

