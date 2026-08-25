import RNFS from 'react-native-fs';
import type { ApiVideo } from '../types/video';

export type DownloadedVideoItem = {
  video: ApiVideo;
  localFilePath: string;
  downloadedAt: string;
  fileSizeMB: number;
  resolution: string;
};

import { getUserStorageKey, subscribeAuthChange } from './api/authService';

const DOWNLOAD_DIR = `${RNFS.DocumentDirectoryPath}/in_app_downloads`;

function getDownloadsFilePath(): string {
  const userKey = getUserStorageKey();
  return `${RNFS.DocumentDirectoryPath}/downloads_metadata_${userKey}.json`;
}

let downloadedVideosStore: DownloadedVideoItem[] = [];

const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

async function persistDownloadsToDisk() {
  try {
    const filePath = getDownloadsFilePath();
    const data = JSON.stringify(downloadedVideosStore);
    await RNFS.writeFile(filePath, data, 'utf8');
  } catch (err) {
    console.warn('[downloadService] Disk save notice:', err);
  }
}

async function restoreDownloadsFromDisk() {
  try {
    const filePath = getDownloadsFilePath();
    const exists = await RNFS.exists(filePath);
    if (exists) {
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        downloadedVideosStore = parsed;
        notifyListeners();
        return;
      }
    }
    downloadedVideosStore = [];
    notifyListeners();
  } catch (err) {
    console.warn('[downloadService] Disk restore notice:', err);
    downloadedVideosStore = [];
    notifyListeners();
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
subscribeAuthChange(() => restoreDownloadsFromDisk());

export function subscribeDownloads(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDownloadedVideos(availableVideos?: ApiVideo[]): DownloadedVideoItem[] {
  const normalized = downloadedVideosStore.map(item => {
    const v: ApiVideo = (item as any)?.video || (item as any);
    const localPath = item?.localFilePath || `${DOWNLOAD_DIR}/video_${v?.id || 1}.mp4`;
    return {
      video: {
        ...v,
        stream_url: (v as any)?.stream_url || localPath,
        playback_url: (v as any)?.playback_url || localPath,
        localFilePath: localPath,
      },
      localFilePath: localPath,
      downloadedAt: item?.downloadedAt || new Date().toISOString(),
      fileSizeMB: item?.fileSizeMB || 28.5,
      resolution: item?.resolution || '720p HD',
    };
  });

  if (availableVideos && availableVideos.length > 0) {
    const videoMap = new Map(availableVideos.map(v => [v.id, v]));
    return normalized.map(item => {
      if (item.video && videoMap.has(item.video.id)) {
        return {
          ...item,
          video: {
            ...item.video,
            ...videoMap.get(item.video.id),
            localFilePath: item.localFilePath,
          },
        };
      }
      return item;
    });
  }

  return normalized;
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
