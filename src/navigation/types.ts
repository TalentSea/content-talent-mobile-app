export type VideoSectionKey = 'popular' | 'processing';

export type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    VideoGrid: {
        section: VideoSectionKey;
    };
    Profile: undefined;
};