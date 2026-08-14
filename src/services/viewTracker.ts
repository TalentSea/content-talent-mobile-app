import RNFS from 'react-native-fs';

const VIEWS_TRACKER_FILE = `${RNFS.DocumentDirectoryPath}/streamr_viewed_videos_24h.json`;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Stores videoId (as String key) -> timestamp (ms)
let viewedVideoTimestamps: Record<string, number> = {};
let isInitialized = false;

export async function initViewTracker(): Promise<void> {
  if (isInitialized) return;
  try {
    const exists = await RNFS.exists(VIEWS_TRACKER_FILE);
    if (exists) {
      const content = await RNFS.readFile(VIEWS_TRACKER_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        viewedVideoTimestamps = parsed;
      }
    }
  } catch (err) {
    console.warn('[viewTracker] Disk restore notice:', err);
  } finally {
    isInitialized = true;
  }
}

// Initial restoration
initViewTracker();

export function hasUserViewedVideoIn24Hours(videoId: number | string): boolean {
  const key = String(videoId);
  const lastViewedAt = viewedVideoTimestamps[key];
  if (!lastViewedAt) return false;
  const elapsed = Date.now() - Number(lastViewedAt);
  return elapsed < TWENTY_FOUR_HOURS_MS;
}

export async function markVideoAsViewed(videoId: number | string): Promise<void> {
  await initViewTracker();
  const key = String(videoId);
  const now = Date.now();
  viewedVideoTimestamps[key] = now;

  // Prune entries older than 30 days to keep json file clean
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  for (const idStr in viewedVideoTimestamps) {
    if (now - Number(viewedVideoTimestamps[idStr]) > THIRTY_DAYS_MS) {
      delete viewedVideoTimestamps[idStr];
    }
  }

  try {
    await RNFS.writeFile(
      VIEWS_TRACKER_FILE,
      JSON.stringify(viewedVideoTimestamps),
      'utf8',
    );
  } catch (err) {
    console.warn('[viewTracker] Disk save notice:', err);
  }
}

export async function resetViewTracker(): Promise<void> {
  viewedVideoTimestamps = {};
  try {
    const exists = await RNFS.exists(VIEWS_TRACKER_FILE);
    if (exists) {
      await RNFS.unlink(VIEWS_TRACKER_FILE);
    }
  } catch (err) {
    console.warn('[viewTracker] Reset notice:', err);
  }
}
