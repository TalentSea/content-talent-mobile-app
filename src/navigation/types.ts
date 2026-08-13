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
    Settings: undefined;
    Notifications: undefined;
    Library: {
        type: 'history' | 'downloads' | 'liked' | 'saved';
    };
    VideoGrid: {
        section: VideoSectionKey;
    };
};
