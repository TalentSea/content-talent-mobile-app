import { useEffect, useMemo, useState } from 'react';
import {
  getDownloadedVideos,
  subscribeDownloads,
  isVideoDownloadedInApp,
  downloadVideoInApp,
  removeDownloadedVideoInApp,
  DownloadedVideoItem,
} from '../services/downloadService';

import type { ApiVideo } from '../types/video';

export function useDownloads(availableVideos: ApiVideo[] = []) {
  const [downloadedVideos, setDownloadedVideos] = useState<DownloadedVideoItem[]>(() =>
    getDownloadedVideos(availableVideos),
  );

  const availableIdsKey = (availableVideos || []).map(v => v.id).join(',');

  useEffect(() => {
    const update = () => {
      setDownloadedVideos(getDownloadedVideos(availableVideos));
    };
    update();
    const unsubscribe = subscribeDownloads(update);
    return () => unsubscribe();
  }, [availableIdsKey]);

  return {
    downloadedVideos,
    isVideoDownloadedInApp,
    downloadVideoInApp,
    removeDownloadedVideoInApp,
  };
}
