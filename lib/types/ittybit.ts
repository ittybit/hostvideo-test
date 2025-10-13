export interface IttybitTask {
    kind: 'video' | 'image' | 'thumbnails' | 'subtitles' | 'outline' | 'speech' | 'chapters' | 'description';
    file_id: string;
    start?: number;
    webhook_url?: string;
    id?: string;
}

export interface IttybitRequestBody {
    [key: string]: unknown;
}