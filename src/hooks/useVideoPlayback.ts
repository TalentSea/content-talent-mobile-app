import { useState } from 'react';
import { fetchVideoPlayInfo } from '../services/api/video';
import type { ApiVideo, PlayInfo } from '../../types/video';

export function useVideoPlayback() {
    const [playingVideo, setPlayingVideo] = useState<PlayInfo | null>(null);
    const [playerLoading, setPlayerLoading] = useState(false);
    const [playbackError, setPlaybackError] = useState('');

    async function playVideo(video: ApiVideo) {
        if (String(video.status).trim().toLowerCase() !== 'ready') {
            return;
        }

        try {
            setPlayerLoading(true);
            setPlaybackError('');

            const data = await fetchVideoPlayInfo(video.id);
            setPlayingVideo({
                ...data,
                title: data.title || video.title,
            });
        } catch (err) {
            setPlaybackError(err instanceof Error ? err.message : 'Failed to play video');
        } finally {
            setPlayerLoading(false);
        }
    }

    function closePlayer() {
        setPlayingVideo(null);
    }

    return {
        playingVideo,
        playerLoading,
        playbackError,
        playVideo,
        closePlayer,
    };
}