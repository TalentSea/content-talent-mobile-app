import { apiGet } from './client';
import type { CaptionTrack } from '../../types/video';

export type HLSCaptionResponse = {
  videoId: number;
  hasInbuiltCaptions: boolean;
  inbuiltCaptionTracks: CaptionTrack[];
  sidecarCaptions: CaptionTrack[];
};

/**
 * Fetches HLS captions (inbuilt and sidecar) for a given video ID from the backend API.
 */
export async function fetchHLSCaptions(videoId: number): Promise<HLSCaptionResponse> {
  try {
    const response = await apiGet<HLSCaptionResponse>(`/api/v1/mobile/videos/${videoId}/captions`);
    if (response) {
      return response;
    }
  } catch (error) {
    console.warn(`[fetchHLSCaptions] API notice for video ${videoId}:`, error);
  }

  return {
    videoId,
    hasInbuiltCaptions: false,
    inbuiltCaptionTracks: [],
    sidecarCaptions: [],
  };
}

