"use client";
import DefaultLayout from "@/components/layout/default";
import LayoutSection from "@/components/layout/section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VideoPlayer } from "@/components/videoplayer";
import { getVideoById } from "@/lib/video";
import { VideoData } from "@/lib/types/video";
import { useParams } from "next/dist/client/components/navigation";
import { useState, useEffect } from "react";

export default function VideoPage() {

    const [user, setUser] = useState<{ id: string } | null>(null);

    const [videoTitle, setVideoTitle] = useState("");
    const [videoDescription, setVideoDescription] = useState("");

    const [loading, setLoading] = useState(true);
    const [videoData, setVideoData] = useState<VideoData | null>(null);

    const [videoProcessing, setVideoProcessing] = useState(false);

    const params = useParams();

    const getVideoData = async () => {
        if(!params.video_id) return;
        try {
            // Fetch video data from your backend or database
            // Example: const response = await fetch(`/api/videos/${video_id}`);
            // const data = await response.json();
            // @ts-expect-error 'video_id' is a dynamic route parameter
            const data = await getVideoById(params?.video_id);
            console.log(data)

            if(data?.body === null && data?.description) {
                console.log(data?.description?.data)
                setVideoDescription(data.description?.data?.description);
            } else {
                setVideoDescription(data.body);
            }

            if(data?.title === null && data?.description) {
                setVideoTitle(data.description?.data?.title);
            } else {
                setVideoTitle(data.title);
            }
            setVideoData(data);

            if(data) {
                const hasVideo = data.video !== null;
                const hasSubtitles = data.subtitles !== null;
                const hasThumbnails = data.thumbnails !== null;
                const hasChapters = data.chapters !== null;
                const hasOutline = data.outline !== null;
                const hasDescription = data.description !== null;
                const hasImage = data.image !== null;

                if(!hasVideo || !hasThumbnails || !hasChapters || !hasOutline || !hasDescription || !hasSubtitles || !hasImage) {
                    setVideoProcessing(true);
                    setTimeout(() => {
                        getVideoData();
                    }, 3000);
                } else {
                    setVideoProcessing(false);
                }
            }
        } catch (error) {
            console.error("Error fetching video data:", error);
        } finally {
            setLoading(false);
        }

    }

    useEffect(() => {
        if(params.video_id) getVideoData();
        // getVideoData uses videoData and videoProcessing states internally, so we don't need to include it in deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    return <DefaultLayout userData={setUser} shouldRequireUser>

        {videoProcessing && <div className="mb-4 p-4 bg-yellow-100 border border-yellow-500 rounded-2xl">
            <p className="text-yellow-800">Your video is still being processed. This may take a few minutes depending on the length of the video. The page will refresh automatically.</p>
        </div>}

        {user && videoData && user.id === videoData.user && 
            <LayoutSection className="mt-8 mb-8">
                <div className="rounded-2xl">
                    <h2 className="text-lg font-bold mb-2">Admin</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                        {videoData?.video !== null ? <div className="bg-green-100 border border-green-500 inline-block p-2 rounded-2xl mr-2">Video</div> : <div className=" mr-2 bg-red-100 border border-red-500 inline-block p-2 rounded-2xl">Video</div>}
                        {videoData?.subtitles !== null ? <div className="bg-green-100 border border-green-500 inline-block p-2 rounded-2xl">Subtitles</div> : <div className="bg-red-100 border border-red-500 inline-block p-2 rounded-2xl">Subtitles</div>}
                        {videoData?.thumbnails !== null ? <div className="bg-green-100 border border-green-500 inline-block p-2 rounded-2xl ml-2">Thumbnails</div> : <div className="bg-red-100 border border-red-500 inline-block p-2 rounded-2xl ml-2">Thumbnails</div>}
                        {videoData?.chapters !== null ? <div className="bg-green-100 border border-green-500 inline-block p-2 rounded-2xl ml-2">Chapters</div> : <div className="bg-red-100 border border-red-500 inline-block p-2 rounded-2xl ml-2">Chapters</div>}
                        {videoData?.outline !== null ? <div className="bg-green-100 border border-green-500 inline-block p-2 rounded-2xl ml-2">Outline</div> : <div className="bg-red-100 border border-red-500 inline-block p-2 rounded-2xl ml-2">Outline</div>}
                        {videoData?.description !== null ? <div className="bg-green-100 border border-green-500 inline-block p-2 rounded-2xl ml-2">Description</div> : <div className="bg-red-100 border border-red-500 inline-block p-2 rounded-2xl ml-2">Description</div>}
                        {videoData?.image !== null ? <div className="bg-green-100 border border-green-500 inline-block p-2 rounded-2xl ml-2">Image</div> : <div className="bg-red-100 border border-red-500 inline-block p-2 rounded-2xl ml-2">Image</div>}
                    </div>
                </div>
            </LayoutSection>
        }
        <LayoutSection className="">
            {loading ? <p>Loading...</p> : videoData ? (
                <div>
                    {!videoData?.video && <div className="">
                        <p className="">Video not available.</p>
                        </div>}
                    <div className="">
                        {videoData?.video?.url && <VideoPlayer title={videoTitle} poster={videoData?.image?.url} src={videoData?.video?.url} subtitles={videoData?.subtitles?.url} thumbnails={videoData?.thumbnails?.url} chapters={videoData?.chapters?.url} />}

                        {user && videoData.user === user.id ? 
                            <div className="mt-10 mb-2"><Input label="Video Title -- This may be pre filled with AI generated content" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder={"Video title"} /></div> : 
                            <div className="font-bold mt-10 text-xl">{videoTitle}</div>
                        }
                        {user && videoData.user === user.id ? 
                            <div className="mt-2 mb-2"><Textarea label="Video Description -- This may be pre filled with AI generated content" value={videoDescription} onChange={(e) => setVideoDescription(e.target.value)} placeholder={"Video description"} /></div> : 
                            <div className="mt-2 whitespace-pre-wrap">{videoDescription}</div>
                        }     
                    </div>

                    {/* <pre>{JSON.stringify(videoData, null, 2)}</pre> */}
                </div>
            ) : (
                <p>Video not found.</p>
            )}
            {/* <pre>{JSON.stringify(videoData, null, 2)}</pre> */}
        </LayoutSection>

    </DefaultLayout>;
}