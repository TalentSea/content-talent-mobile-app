/**
 * All statuses the backend can assign via Bunny Stream webhook codes 0–10.
 * The string fallback covers any future/unknown codes.
 */
export type VideoStatus =
  | 'PENDING'          // code 0 — Queued in GPU pipeline
  | 'PROCESSING'       // code 1 — Extracting audio/frame preview
  | 'ENCODING'         // code 2 — Encoding active (encode_progress < 100)
  | 'READY'            // code 3 — All resolutions ready
  | 'PLAYABLE'         // code 4 — First resolution (240p) ready
  | 'FAILED'           // code 5 — Corrupt video codec/format
  | 'UPLOAD_FINISHED'  // code 7 — Bytes received by Bunny
  | 'UPLOAD_FAILED'    // code 8 — Upload interrupted
  | string;            // fallback

export type CaptionTrack = {
  uri: string;
  language?: string;
  label?: string;
  mimeType?: 'text/vtt' | 'application/x-subrip';
};

export type ApiVideo = {
  id: number;
  user_id?: number;
  bunny_video_id?: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  thumbnail_url?: string;
  alt_thumbnails?: string[];
  status: VideoStatus;
  encode_progress?: number;    // 0–100, populated during ENCODING
  is_playable?: boolean;       // true once webhook code 4 fires
  captions?: CaptionTrack[];   // sidecar caption URLs from webhook code 9
};

export type PlayInfo = {
  title: string;
  description?: string;
  stream_url: string;
  poster?: string;
  captions?: CaptionTrack[];   // sidecar captions (fallback for non-HLS)
};

export type VideoSectionKey = 'popular' | 'processing';