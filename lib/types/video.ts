export interface VideoData {
    id: string;
    slug: string;
    user: string;
    title: string | null;
    body: string | null;
    public: boolean;
    comments: boolean;
    created_at: string;
    ittybit_master_file_id?: string;
    video: { url: string } | null;
    subtitles: { url: string } | null;
    thumbnails: { url: string } | null;
    chapters: { url: string } | null;
    outline: { url: string } | null;
    description: {
        data: {
            title: string;
            description: string;
        }
    } | null;
    image: { url: string } | null;
}

export interface VideoFile {
    id: string;
    [key: string]: unknown;
}