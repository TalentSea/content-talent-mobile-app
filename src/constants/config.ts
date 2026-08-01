export const API_BASE_URL = 'http://138.68.140.83:8000';
export const DEFAULT_AUTH_TOKEN = 'test_token';

/**
 * Flags to enable mock API for videos and HLS inbuilt captions.
 * Set to `false` to query live server http://138.68.140.83:8000 with test_token credentials.
 */
export const USE_MOCK_VIDEOS = false;
export const USE_MOCK_CAPTIONS = false;

/**
 * Standard test HLS stream with in-stream / embedded captions (multi-language: EN, ES, FR, DE)
 * Used when USE_MOCK_CAPTIONS is true or when testing native ExoPlayer HLS embedded subtitle detection.
 */
export const MOCK_HLS_STREAM_WITH_INBUILT_CAPTIONS =
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';