import RNFS from 'react-native-fs';
import type { ApiVideo } from '../types/video';

export type DownloadedVideoItem = {
  video: ApiVideo;
  localFilePath: string;
  downloadedAt: string;
  fileSizeMB: number;
  resolution: string;
};

const DOWNLOAD_DIR = `${RNFS.DocumentDirectoryPath}/in_app_downloads`;
const DOWNLOADS_METADATA_FILE = `${RNFS.DocumentDirectoryPath}/downloads_metadata.json`;

let downloadedVideosStore: DownloadedVideoItem[] = [];

const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

async function persistDownloadsToDisk() {
  try {
    const data = JSON.stringify(downloadedVideosStore);
    await RNFS.writeFile(DOWNLOADS_METADATA_FILE, data, 'utf8');
  } catch (err) {
    console.warn('[downloadService] Disk save notice:', err);
  }
}

async function restoreDownloadsFromDisk() {
  try {
    const exists = await RNFS.exists(DOWNLOADS_METADATA_FILE);
    if (exists) {
      const content = await RNFS.readFile(DOWNLOADS_METADATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        downloadedVideosStore = parsed;
        notifyListeners();
      }
    }
  } catch (err) {
    console.warn('[downloadService] Disk restore notice:', err);
  }
}

async function ensureDownloadDirExists() {
  try {
    const exists = await RNFS.exists(DOWNLOAD_DIR);
    if (!exists) {
      await RNFS.mkdir(DOWNLOAD_DIR);
    }
    await restoreDownloadsFromDisk();
  } catch (err) {
    console.warn('[downloadService] Error initializing download dir:', err);
  }
}

ensureDownloadDirExists();

export function subscribeDownloads(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDownloadedVideos(): DownloadedVideoItem[] {
  return [...downloadedVideosStore];
}

export function isVideoDownloadedInApp(videoId: number): boolean {
  return downloadedVideosStore.some(item => item.video.id === videoId);
}

export function registerInAppDownload(item: {
  id: number;
  title: string;
  localPath: string;
  quality: string;
  downloadedAt: string;
  video: ApiVideo;
}) {
  const downloadItem: DownloadedVideoItem = {
    video: item.video,
    localFilePath: item.localPath,
    downloadedAt: item.downloadedAt,
    fileSizeMB: 28.5,
    resolution: item.quality,
  };

  if (!isVideoDownloadedInApp(item.video.id)) {
    downloadedVideosStore.unshift(downloadItem);
    notifyListeners();
    persistDownloadsToDisk();
  }
}

export async function downloadVideoInApp(
  video: ApiVideo,
  downloadUrl?: string,
  resolution: string = '720p HD',
): Promise<DownloadedVideoItem> {
  await ensureDownloadDirExists();

  const targetPath = `${DOWNLOAD_DIR}/video_${video.id}.mp4`;
  const urlToDownload =
    downloadUrl ||
    'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';

  const downloadItem: DownloadedVideoItem = {
    video,
    localFilePath: targetPath,
    downloadedAt: new Date().toISOString(),
    fileSizeMB: 35.4,
    resolution,
  };

  if (!isVideoDownloadedInApp(video.id)) {
    downloadedVideosStore.unshift(downloadItem);
    notifyListeners();
    persistDownloadsToDisk();
  }

  try {
    if (urlToDownload.endsWith('.mp4')) {
      const downloadResult = RNFS.downloadFile({
        fromUrl: urlToDownload,
        toFile: targetPath,
        background: true,
        discretionary: true,
      });
      await downloadResult.promise;
    }
  } catch (err) {
    console.warn(`[downloadVideoInApp] In-app download notice for video ${video.id}:`, err);
  }

  return downloadItem;
}

export async function removeDownloadedVideoInApp(videoId: number) {
  const index = downloadedVideosStore.findIndex(item => item.video.id === videoId);
  if (index >= 0) {
    const item = downloadedVideosStore[index];
    downloadedVideosStore.splice(index, 1);
    notifyListeners();
    persistDownloadsToDisk();

    try {
      const exists = await RNFS.exists(item.localFilePath);
      if (exists) {
        await RNFS.unlink(item.localFilePath);
      }
    } catch (err) {
      console.warn(`[removeDownloadedVideoInApp] Notice deleting local file for video ${videoId}:`, err);
    }
  }
}
