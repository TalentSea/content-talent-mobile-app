export type VideoSectionKey = 'popular' | 'processing' | 'continue' | 'recent';

export type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    CategoryVideos: {
        category: string;
    };
    Playlist: undefined;
    Search: undefined;
    Categories: undefined;
    CategoryDetail: {
        category: string;
    };
    Profile: undefined;
    VideoGrid: {
        section: VideoSectionKey;
    };
    Notifications: undefined;
    Settings: undefined;
};