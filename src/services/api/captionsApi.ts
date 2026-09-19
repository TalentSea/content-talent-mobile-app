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
  // Captions are returned directly in the GET /api/v1/mobile/videos/{id} response payload
  return {
    videoId,
    hasInbuiltCaptions: false,
    inbuiltCaptionTracks: [],
    sidecarCaptions: [],
  };
}

