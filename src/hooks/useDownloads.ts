import { useEffect, useState } from 'react';
import {
  getDownloadedVideos,
  subscribeDownloads,
  isVideoDownloadedInApp,
  downloadVideoInApp,
  removeDownloadedVideoInApp,
  DownloadedVideoItem,
} from '../services/downloadService';

export function useDownloads() {
  const [downloadedVideos, setDownloadedVideos] = useState<DownloadedVideoItem[]>(
    getDownloadedVideos(),
  );

  useEffect(() => {
    const unsubscribe = subscribeDownloads(() => {
      setDownloadedVideos(getDownloadedVideos());
    });
    return () => unsubscribe();
  }, []);

  return {
    downloadedVideos,
    isVideoDownloadedInApp,
    downloadVideoInApp,
    removeDownloadedVideoInApp,
  };
}
