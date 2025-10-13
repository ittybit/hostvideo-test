"use client";

import DefaultLayout from "@/components/layout/default";
import LayoutSection from "@/components/layout/section";
import { VideoPlayer } from "@/components/videoplayer";

import { useState, useEffect, DragEvent } from "react";
import { createVideoReference, updateVideoDetails } from "@/lib/video";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createSignedUrl, createTasksForVideo, getFile } from "@/lib/ittybit";
import Link from "next/link";

import { VideoScreenshot, VideoInfo } from "@/lib/types/screenshot";
import { User } from "@/lib/types/user";
import { VideoData } from "@/lib/types/video";

const generateVideoScreenshots = async (
    file: File,
    format: 'image/jpeg' | 'image/png' = 'image/jpeg',
    quality: number = 0.8
): Promise<VideoScreenshot[]> => {
    // 1. Basic validation to ensure we're dealing with a video file.
    if (!file.type.startsWith('video/')) {
        throw new Error('Invalid file type: The provided file is not a video.');
    }

    const screenshots: any[] = [];
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Create a temporary URL to load the video file into the video element.
    const objectUrl = URL.createObjectURL(file);

    // This ensures the cleanup runs even if errors occur.
    try {
        video.src = objectUrl;

        // 2. Wait for the video's metadata to load to get its duration.
        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => {
                // Set canvas dimensions to match the video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                resolve();
            };
            video.onerror = (err) => reject(new Error('Failed to load video metadata.'));
        });

        const duration = Math.floor(video.duration);
        if (duration <= 0) {
            throw new Error("Video has no duration or is invalid.");
        }

        // Take screenshots at intervals
        const interval = Math.max(1, Math.floor(duration / 10)); // Take up to 10 screenshots
        const timePoints = Array.from(
            { length: Math.min(10, duration) },
            (_, i) => Math.floor(i * interval)
        ).filter(t => t > 0);

        for (const timePoint of timePoints) {
            try {
                video.currentTime = timePoint;
                
                // 4. Wait for the video to seek to the specified time with a timeout
                await Promise.race([
                    new Promise<void>((resolve, reject) => {
                        video.onseeked = () => resolve();
                        video.onerror = () => reject(new Error(`Failed to seek video at time ${timePoint}.`));
                    }),
                    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Seek timeout')), 5000))
                ]);

                if (!context) {
                    console.warn("Could not get 2D context from canvas.");
                    continue;
                }

                // 5. Draw the current video frame onto the canvas.
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // 6. Convert the canvas image to a data URL and add it to our array.
                const dataUrl = canvas.toDataURL(format, quality);
                screenshots.push({
                    time: timePoint,
                    url: dataUrl,
                    user_selected: false
                });
            } catch (error) {
                console.warn(`Failed to capture screenshot at ${timePoint}s:`, error);
                continue; // Skip this screenshot and continue with the next
            }
        }

        // If we couldn't get any screenshots, try one last time at the beginning
        if (screenshots.length === 0) {
            try {
                video.currentTime = 0;
                await new Promise<void>(resolve => {
                    video.onseeked = () => resolve();
                    video.onerror = () => resolve(); // Ignore error and resolve anyway
                });

                if (context) {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL(format, quality);
                    screenshots.push({
                        time: 0,
                        url: dataUrl,
                        user_selected: false
                    });
                }
            } catch (error) {
                console.warn('Failed to capture fallback screenshot:', error);
            }
        }

        return screenshots;

    } finally {
        // 7. IMPORTANT: Revoke the object URL to release memory resources.
        URL.revokeObjectURL(objectUrl);
    }
};


export default function UploadPage() {

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [videoInfo, setVideoInfo] = useState<{
    duration: number | null;
    width: number | null;
    height: number | null;
    thumbnailUrl: string | null;
}>({ duration: null, width: null, height: null, thumbnailUrl: null });

    const supabase = createClient();

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [screenshots, setScreenshots] = useState<VideoScreenshot[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const [selectedScreenshot, setSelectedScreenshot] = useState<VideoScreenshot | null>(null);

    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    const [visible, setVisible] = useState<boolean>(true);
    const [commentsEnabled, setCommentsEnabled] = useState<boolean>(true);

    const [videoRecord, setVideoRecord] = useState<VideoData | null>(null);

    const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [savingDetails, setSavingDetails] = useState<boolean>(false);

    // --- Event Handlers ---

    const doUpload = async () => {
        if (!selectedFile) {
            alert("Please select a file first!");
            return;
        }

        console.log("Uploading file:", selectedFile);
        console.log(user)

        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9._\-,\[\]()%+~]/g, '_');
        const randomString = Math.random().toString(36).substring(2, 15).replace(/[^a-zA-Z0-9._\-,\[\]()%+~]/g, '_');
        
        if (!user) {
            throw new Error('No user found');
        }
        const generatedPath = `${user.id}/${timestamp}/${randomString}-${sanitizedFileName}`;
        const response = await createSignedUrl({ path: generatedPath, method: "PUT" });

        if (!response) {
            throw new Error('Failed to generate signed URL');
        }

        // Set initial states
        setIsUploadingVideo(true);
        setUploadProgress(0);
        setUploadError(null);

        try {
            const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks
            const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
            let uploadedChunks = 0;
            const uploadUrl = new URL(response);

            // Upload chunks sequentially
            for (let start = 0; start < selectedFile.size; start += CHUNK_SIZE) {
                const end = Math.min(start + CHUNK_SIZE - 1, selectedFile.size - 1);
                const chunk = selectedFile.slice(start, end + 1);
                
                const headers = {
                    'Content-Range': `bytes ${start}-${end}/${selectedFile.size}`,
                    'Content-Type': 'application/octet-stream'
                };

                const result = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers,
                    body: chunk
                });

                if (!result.ok) {
                    const errorText = await result.text().catch(() => 'No error details available');
                    throw new Error(`Upload failed with status ${result.status}: ${result.statusText}\nDetails: ${errorText}`);
                }

                const response = await result.text();

                // If this is the last chunk (status 201), parse the response for the ID
                let responseData;
                if (result.status === 201 && response) {
                    try {
                        responseData = JSON.parse(response);
                        if (!responseData.id) {
                            console.warn('Final response missing ID:', responseData);
                        }
                    } catch (e) {
                        console.warn('Failed to parse final response:', e);
                    }
                }

                uploadedChunks++;
                const progress = Math.round((uploadedChunks / totalChunks) * 100);
                setUploadProgress(progress);

                // If this was the last chunk, return the response data
                if (uploadedChunks === totalChunks) {
                    return responseData || { id: generatedPath };
                }
            }

            // If we somehow get here without returning from the last chunk
            return { id: generatedPath }
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadError('Upload failed. Please try again.');
            throw error;
        } finally {
            setIsUploadingVideo(false);
        }
    }

    const doSaveDetails = async () => {
        if (!videoRecord) return;
        try {
            setSavingDetails(true);
            const updated = await updateVideoDetails(videoRecord.id, {
                title,
                body: description,
                public: visible,
                comments: commentsEnabled
            });
            toast.success("Video details updated successfully!");
        } catch (error) {
            console.error("Failed to update video details:", error);
        } finally {
            setSavingDetails(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0] || null;
        if (file) {
            // Optional: Add validation for file type, e.g., video
            if (file.type.startsWith("video/")) {
                setSelectedFile(file);
            } else {
                alert("Please drop a video file.");
            }
        }
    };
    
    const handleUpload = async () => {
        if (!selectedFile) {
            alert("Please select a file first!");
            return;
        }

        setIsUploadingVideo(true);
        setUploadProgress(0);
        setUploadError(null);

        try {
            // Call the doUpload function from lib/upload
            const vdata = await doUpload();
            const fileId = vdata.id;
            const fileInfo = await getFile({ fileId });
            const vref = await createVideoReference(fileInfo);
            await createTasksForVideo({ videoReference: vref.id, fileId });
            setVideoRecord(vref);
            toast.success("Video uploaded successfully!");
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadError("Upload failed. Please try again.");
        } finally {
            setIsUploadingVideo(false);
        }
    };

    // --- Helper to format file size ---
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const handleSelectedFile = async () => {
        if (!selectedFile) return;
        handleUpload();
        setTitle(selectedFile.name);
        const video = document.createElement('video');
        const objectUrl = URL.createObjectURL(selectedFile);
        setIsLoading(true);
        // This function will be called once the video's metadata has loaded
        video.onloadedmetadata = async () => {
            console.log("Metadata loaded!");
            
            const duration = video.duration;
            const width = video.videoWidth;
            const height = video.videoHeight;

            const screengrabs = await generateVideoScreenshots(selectedFile);
            setScreenshots(screengrabs);
            setSelectedScreenshot(screengrabs[Math.floor(screengrabs.length / 2)] || null);
            
            setVideoInfo(prev => ({ ...prev, duration, width, height }));
            video.currentTime = duration * 0.1; 
            setIsLoading(false);
        };

        // This function is called when the video has seeked to the desired frame
        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                // Get the thumbnail as a data URL
                const thumbnailUrl = canvas.toDataURL('image/jpeg');
                setVideoInfo(prev => ({ ...prev, thumbnailUrl }));
            }
        };

        video.src = objectUrl;

        // --- Cleanup function ---
        // This is crucial to prevent memory leaks!
        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    }

    useEffect(() => {
        // This effect runs whenever the selectedFile changes
        if (selectedFile) {
            handleSelectedFile();
        }
    }, [selectedFile]);

    useEffect(() => {
        if(!user) {
            loadUser();
        }
    }, [user]);

    return (
        <DefaultLayout shouldRequireUser={true}>
            <LayoutSection>
                {/* Conditionally render based on whether a file is selected */}
                { isLoading && (
                    <div className="w-full text-center p-8">
                        <p className="text-lg font-semibold text-gray-700">Processing video...</p>
                    </div>
                )}

                {!isLoading && (
                    <>
                        {!selectedFile ? (
                            <div
                                className={`w-full border-2 border-dashed p-8 text-center rounded-2xl transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <h2 className="text-2xl font-bold mb-4">Upload Your Video</h2>
                                <p className="mb-4 text-gray-500">Drag and drop your video file here, or click to select a file.</p>
                                <input
                                    type="file"
                                    className="hidden"
                                    id="fileUpload"
                                    onChange={handleFileChange}
                                    accept="video/*" // Restrict to video files
                                />
                                <label htmlFor="fileUpload" className="cursor-pointer bg-indigo-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition-colors">
                                    Select File
                                </label>
                            </div>
                        ) : (
                            <div className="w-full md:flex bg-white p-8">
                                <div className="md:w-1/2 md:max-w-1/2 p-2">
                                    <VideoPlayer src={URL.createObjectURL(selectedFile)} />
                                </div>
                                <div className="p-2 md:w-1/2">
                                    <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
                                        <p><strong>Duration:</strong> {Math.floor(videoInfo?.duration || 0)} seconds</p>
                                        <p><strong>Dimensions:</strong> {videoInfo.width} x {videoInfo.height}</p>
                                        <p><strong>File Size:</strong> {formatFileSize(selectedFile.size)}</p>
                                    </div>
                                    <div className="justify-center gap-4">
                                        <button onClick={() => setSelectedFile(null)} className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors">
                                            Choose a different file
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        </>
                )}
            </LayoutSection>


    

            {selectedFile && !isLoading && videoRecord && (
                <LayoutSection className="mt-8">
                   <Link href={`/${videoRecord.slug}`} className="inline rounded-2xl block p-4 bg-green-400 cursor-pointer">View Video</Link>

                </LayoutSection>
            )}

            {isUploadingVideo && (
                <div className="fixed bottom-10 right-10 bg-white rounded-2xl shadow-xl">
                    <div className="w-full text-center p-8">
                        <p className="text font-semibold text-gray-700 mb-4">Uploading video... {uploadProgress}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                </div>
            )}
        </DefaultLayout>
    );
}