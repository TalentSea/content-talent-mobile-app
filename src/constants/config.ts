export const API_BASE_URL = 'http://138.68.140.83:8000';

export const DEFAULT_AUTH_TOKEN = 'talentsea_secret_api_key_2026';

export const RAZORPAY_KEY_ID = 'rzp_test_TRDlW57SfahBup';
/**
 * Flags to enable mock API for videos and HLS inbuilt captions.
 * Set to `false` to query live server http://138.68.140.83:8000 with talentsea_secret_api_key_2026 credentials.
 */
export const USE_MOCK_VIDEOS = false;
export const USE_MOCK_CAPTIONS = false;

/**
 * Standard test HLS stream with in-stream / embedded captions (multi-language: EN, ES, FR, DE)
 * Used when USE_MOCK_CAPTIONS is true or when testing native ExoPlayer HLS embedded subtitle detection.
 */
export const MOCK_HLS_STREAM_WITH_INBUILT_CAPTIONS =
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';

/**
 * Standard Google IMA sample VAST tag URL for testing pre-roll / mid-roll ad breaks.
 */
export const DEFAULT_AD_TAG_URL =
  'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&type=js&submodel=1';