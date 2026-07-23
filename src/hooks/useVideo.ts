import { useEffect, useState } from 'react';
import { fetchVideos } from '../services/api/video';
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
      const data = await fetchVideos();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();

    const interval = setInterval(() => {
      loadVideos(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const popularVideos = videos.filter(video => isStreamable(video.status));

  const processingVideos = videos.filter(video => !isStreamable(video.status));

  return {
    videos,
    popularVideos,
    processingVideos,
    loading,
    error,
    reload: loadVideos,
  };
}