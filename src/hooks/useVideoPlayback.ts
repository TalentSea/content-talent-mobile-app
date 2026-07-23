import { useCallback, useState } from 'react';
import { fetchVideoPlayInfo } from '../services/api/video';
import type { ApiVideo, PlayInfo } from '../../types/video';
import { isStreamable } from '../constants/videoStatus';

export function useVideoPlayback(videoList: ApiVideo[] = []) {
    const [playingVideo, setPlayingVideo] = useState<PlayInfo | null>(null);
    const [currentVideoId, setCurrentVideoId] = useState<number | null>(null);
    const [playerLoading, setPlayerLoading] = useState(false);
    const [playbackError, setPlaybackError] = useState('');
    const [autoplay, setAutoplay] = useState(true);

    const playVideo = useCallback(async (video: ApiVideo) => {
        if (!isStreamable(video.status)) {
            return;
        }

        try {
            setPlayerLoading(true);
            setPlaybackError('');

            const data = await fetchVideoPlayInfo(video.id);
            setCurrentVideoId(video.id);
            setPlayingVideo({
                ...data,
                title: data.title || video.title,
                captions: data.captions ?? video.captions ?? [],
            });
        } catch (err) {
            setPlaybackError(err instanceof Error ? err.message : 'Failed to play video');
        } finally {
            setPlayerLoading(false);
        }
    }, []);

    const playNext = useCallback(async () => {
        if (currentVideoId == null || videoList.length === 0) return;

        const currentIndex = videoList.findIndex(v => v.id === currentVideoId);
        const nextIndex = currentIndex + 1;

        if (nextIndex < videoList.length) {
            await playVideo(videoList[nextIndex]);
        }
    }, [currentVideoId, videoList, playVideo]);

    const handleVideoEnd = useCallback(() => {
        if (autoplay) {
            playNext();
        }
    }, [autoplay, playNext]);

    function closePlayer() {
        setPlayingVideo(null);
        setCurrentVideoId(null);
    }

    // Check if there's a next video available
    const hasNextVideo = (() => {
        if (currentVideoId == null || videoList.length === 0) return false;
        const currentIndex = videoList.findIndex(v => v.id === currentVideoId);
        return currentIndex >= 0 && currentIndex < videoList.length - 1;
    })();

    return {
        playingVideo,
        playerLoading,
        playbackError,
        autoplay,
        hasNextVideo,
        setAutoplay,
        playVideo,
        playNext,
        handleVideoEnd,
        closePlayer,
    };
}