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
  const [downloadedVideos, setDownloadedVideos] = useState<DownloadedVideoItem[]>(getDownloadedVideos);

  useEffect(() => {
    const update = () => {
      setDownloadedVideos(getDownloadedVideos());
    };
    const unsubscribe = subscribeDownloads(update);
    return () => unsubscribe();
  }, []);

  const availableIdsKey = (availableVideos || []).map(v => v.id).join(',');

  const filteredDownloadedVideos = useMemo(() => {
    if (!availableVideos || availableVideos.length === 0) return downloadedVideos;
    const availableIds = new Set(availableVideos.map(v => v.id));
    return downloadedVideos.filter(item => availableIds.has(item.video.id));
  }, [downloadedVideos, availableIdsKey]);

  return {
    downloadedVideos: filteredDownloadedVideos,
    isVideoDownloadedInApp,
    downloadVideoInApp,
    removeDownloadedVideoInApp,
  };
}
