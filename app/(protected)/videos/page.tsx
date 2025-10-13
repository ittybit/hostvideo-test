"use client"

import DefaultLayout from "@/components/layout/default";
import LayoutSection from "@/components/layout/section";
import { getVideosForSelf } from "@/lib/video";
import { Loader2 } from "lucide-react";

import { useEffect, useState } from "react";
import Image from 'next/image';
import { VideoData } from "@/lib/types/video";

export default function VideosList() {

    const [loadingVideos, setLoadingVideos] = useState(false)
    const [videos, setVideos] = useState<VideoData[]>([])


    const doLoadVideos = async () => {
        setLoadingVideos(true)
        const vs = await getVideosForSelf()
        setVideos(vs)
        setLoadingVideos(false)
    }

    useEffect(() => {
        doLoadVideos()
    }, [])

    return <DefaultLayout shouldRequireUser>
        <LayoutSection>
            <h1 className="text-xl font-bold">Videos List</h1>
            <p className="text-gray-600 mb-2">All your videos in one place.</p>
            {loadingVideos && <Loader2 className="animate-spin" />}
        </LayoutSection>

        {!loadingVideos && videos.length === 0 && <LayoutSection>
            <p className="text-gray-600">You have no videos uploaded yet.</p>
        </LayoutSection>}

        {!loadingVideos && videos.length > 0 && <LayoutSection className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map(video => (
                    <div key={video.id} className="border rounded-lg overflow-hidden">
                        {video.image?.url ? (
                            <Image src={video.image.url} alt={video.title || 'Video'} width={480} height={192} className="w-full h-48 object-cover" />
                        ) : (
                            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500">No Thumbnail</span>
                            </div>
                        )}
                        <div className="p-4">
                            <h2 className="text-lg font-semibold">{video.title}</h2>
                            <p className="text-gray-600 text-sm mb-2">{video.body}</p>
                            <a href={`/${video.slug}`} className="text-indigo-600 hover:underline">View Details</a>
                        </div>
                    </div>
                ))}
            </div>
        </LayoutSection>}
    </DefaultLayout>
}