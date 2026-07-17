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
    status: 'pending' | 'processing' | 'ready' | 'failed' | string;
};

export type PlayInfo = {
    title: string;
    description?: string;
    stream_url: string;
    poster?: string;
};

export type VideoSectionKey = 'popular' | 'processing';