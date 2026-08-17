import { useEffect, useState } from 'react';
import { fetchVideos } from '../services/api/video';
import { subscribeVideoCatalog } from '../services/api/mockVideoApi';
import { subscribeViewTracker } from '../services/viewTracker';
import { subscribeUserActivity } from '../services/userActivity';
import type { ApiVideo } from '../../types/video';
import { isStreamable } from '../constants/videoStatus';

export function useVideos() {
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadVideos(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError('');
      const response = await fetchVideos({ page: 1, limit: 50 });
      setVideos(response.items || []);
    } catch (err) {
      console.warn('[useVideos] Error loading videos:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();

    const unsubscribeCatalog = subscribeVideoCatalog(() => {
      loadVideos(false);
    });

    const unsubscribeViews = subscribeViewTracker(() => {
      loadVideos(false);
    });

    const unsubscribeActivity = subscribeUserActivity(() => {
      loadVideos(false);
    });

    const interval = setInterval(() => {
      loadVideos(false);
    }, 10000);

    return () => {
      unsubscribeCatalog();
      unsubscribeViews();
      unsubscribeActivity();
      clearInterval(interval);
    };
  }, []);

  const filteredPopular = videos.filter(video =>
    video.is_playable || isStreamable(video.status),
  );

  const popularVideos = filteredPopular.length > 0 ? filteredPopular : videos;
  const processingVideos = videos.filter(video => !video.is_playable && !isStreamable(video.status));

  return {
    videos,
    popularVideos,
    processingVideos,
    loading,
    error,
    reload: loadVideos,
  };
}