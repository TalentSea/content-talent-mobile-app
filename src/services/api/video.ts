import { apiGet } from './client';
import type { ApiVideo, PlayInfo } from '../../../types/video';

export function fetchVideos() {
    return apiGet<ApiVideo[]>('/api/v1/videos');
}

export function fetchVideoPlayInfo(videoId: number) {
    return apiGet<PlayInfo>(`/api/v1/videos/${videoId}/play`);
}