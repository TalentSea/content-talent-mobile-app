import { apiGet } from './client';
import { USE_MOCK_CAPTIONS } from '../../constants/config';
import type { CaptionTrack } from '../../types/video';

export type HLSCaptionResponse = {
  videoId: number;
  hasInbuiltCaptions: boolean;
  inbuiltCaptionTracks: CaptionTrack[];
  sidecarCaptions: CaptionTrack[];
};

/**
 * Mock HLS Inbuilt Caption tracks database for testing and frontend development.
 * Later can be seamlessly replaced by real API backend response.
 */
const MOCK_HLS_CAPTIONS_DATABASE: Record<number, HLSCaptionResponse> = {
  1: {
    videoId: 1,
    hasInbuiltCaptions: true,
    inbuiltCaptionTracks: [
      {
        language: 'en',
        label: 'English',
        isInbuilt: true,
        trackIndex: 0,
        kind: 'subtitles',
      },
      {
        language: 'hi',
        label: 'Hindi',
        isInbuilt: true,
        trackIndex: 1,
        kind: 'subtitles',
      },
      {
        language: 'ta',
        label: 'Tamil',
        isInbuilt: true,
        trackIndex: 2,
        kind: 'subtitles',
      },
    ],
    sidecarCaptions: [],
  },
};

/**
 * Default mock fallback response for any video ID without specific mock overrides
 */
const DEFAULT_MOCK_CAPTION_RESPONSE = (videoId: number): HLSCaptionResponse => ({
  videoId,
  hasInbuiltCaptions: true,
  inbuiltCaptionTracks: [
    {
      language: 'en',
      label: 'English',
      isInbuilt: true,
      trackIndex: 0,
      kind: 'subtitles',
    },
    {
      language: 'hi',
      label: 'Hindi',
      isInbuilt: true,
      trackIndex: 1,
      kind: 'subtitles',
    },
    {
      language: 'ta',
      label: 'Tamil',
      isInbuilt: true,
      trackIndex: 2,
      kind: 'subtitles',
    },
  ],
  sidecarCaptions: [],
});

/**
 * Fetches HLS captions (inbuilt and sidecar) for a given video ID.
 * Uses Mock API when USE_MOCK_CAPTIONS is enabled, or real API endpoint when disabled.
 */
export async function fetchHLSCaptions(videoId: number): Promise<HLSCaptionResponse> {
  if (USE_MOCK_CAPTIONS) {
    // Simulate slight network delay for realistic mock API testing
    await new Promise<void>(resolve => setTimeout(() => resolve(), 150));

    const mockData = MOCK_HLS_CAPTIONS_DATABASE[videoId];
    return mockData ?? DEFAULT_MOCK_CAPTION_RESPONSE(videoId);
  }

  // Real Backend API endpoint call
  try {
    return await apiGet<HLSCaptionResponse>(`/api/v1/videos/${videoId}/captions`);
  } catch (error) {
    console.warn(`[captionsApi] Real API call failed for video ${videoId}, falling back:`, error);
    return DEFAULT_MOCK_CAPTION_RESPONSE(videoId);
  }
}
