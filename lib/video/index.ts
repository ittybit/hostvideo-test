"use client";

import { createClient } from "@/lib/supabase/client";
import getUser from "@/lib/auth/user";
import { nanoid } from "nanoid";

export const updateVideoDetails = async (videoId: string, details: {
    title?: string;
    body?: string;
    public?: boolean;
    comments?: boolean;
}) => {
    const supabase = createClient();
    const user = await getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.from('videos')
        .update(details)
        .eq('id', videoId)
        .eq('user', user.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating video details:", error);
        throw new Error("Failed to update video details");
    }

    return data;
}

import { VideoData, VideoFile } from '../types/video';

export const createVideoReference = async(
    file: VideoFile,
) => {
    const supabase = createClient();

    const id = nanoid(10);
    const user_id = (await getUser())?.id;

    console.log(file, 'fileref')

    const { data, error } = await supabase.from('videos').insert({
        slug: id,
        user: user_id,
        ittybit_master_file_id: file.id,
    }).select().single();

    if (error) {
        console.error("Error creating video reference:", error);
        throw new Error("Failed to create video reference");
    }

    return data;

}

export const getVideoById = async (videoId: string) => {
    const supabase = createClient();
    const user = await getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.from('videos')
        .select('*')
        .eq('slug', videoId)
        .single();

    if (error) {
        console.error("Error fetching video:", error);
        throw new Error("Failed to fetch video");
    }

    if (!data.public && data.user !== user.id) {
        throw new Error("Unauthorized access to video");
    }

    return data;
}

export const getVideosForSelf = async () => {
    const supabase = createClient();
    const user = await getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.from('videos')
        .select('*')
        .eq('user', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching videos for self:", error);
        throw new Error("Failed to fetch videos for self");
    }
    return data;
}

export const getVideosForUser = async (userId: string) => {
    const supabase = createClient();
    const user = await getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.from('videos')
        .select('*')
        .eq('user', userId)
        .eq('public', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching videos for user:", error);
        throw new Error("Failed to fetch videos for user");
    }
    return data;
}