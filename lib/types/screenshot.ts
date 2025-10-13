export interface VideoScreenshot {
    time: number;
    url: string;
    user_selected: boolean;
}

export interface VideoInfo {
    duration: number | null;
    width: number | null;
    height: number | null;
    thumbnailUrl: string | null;
}