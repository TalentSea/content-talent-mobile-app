export type VideoStatus =
  | 'draft'
  | 'published'
  | 'scheduled'
  | 'PENDING'
  | 'PROCESSING'
  | 'ENCODING'
  | 'READY'
  | 'PLAYABLE'
  | 'FAILED'
  | 'UPLOAD_FINISHED'
  | 'UPLOAD_FAILED'
  | string;

export type CaptionTrack = {
  uri?: string;
  language?: string;
  label?: string;
  mimeType?: 'text/vtt' | 'application/x-subrip' | string;
  isInbuilt?: boolean;
  isDefault?: boolean;
  trackIndex?: number;
  kind?: 'subtitles' | 'captions' | 'descriptions';
};

export type ApiVideo = {
  id: number;
  bunny_video_id?: string;
  bunny_library_id?: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  status: VideoStatus;
  encode_progress: number;
  is_playable: boolean;
  views: number;
  duration: string | null;
  main_thumbnail_url: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string | null;
};

export type VideoDetails = ApiVideo & {
  playback_url: string | null;
  alt_thumbnail_urls: string[];
  caption_url?: string;
  caption_lang?: string;
  captions_data?: Array<{ label?: string; srclang?: string; url?: string; isInbuilt?: boolean; is_default?: boolean }>;
};

export type PaginatedVideosResponse = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: ApiVideo[];
};

export type DownloadItem = {
  resolution: string;
  label: string;
  url: string;
};

export type PlayInfo = {
  title: string;
  category?: string;
  description?: string;
  stream_url: string;
  mp4Url?: string;
  downloadUrls?: DownloadItem[];
  poster?: string;
  captions?: CaptionTrack[];
  inbuiltCaptionTracks?: CaptionTrack[];
  hasInbuiltCaptions?: boolean;
  adTagUrl?: string;
};

export type VideoSectionKey = 'popular' | 'processing';