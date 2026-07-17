export type VideoSectionKey = 'popular' | 'processing';

export type RootStackParamList = {
    Home: undefined;
    VideoGrid: {
        section: VideoSectionKey;
    };
};