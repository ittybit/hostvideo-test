"use client";

import { createClient } from "@/lib/supabase/client";
import getUser from "@/lib/auth/user";
import { nanoid } from "nanoid";

export const doUpload = async (file: File, title: string, description: string) => {
    const supabase = createClient();
    const user = await getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${new Date().toISOString()}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
        .from('upload-files')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });


    if (error) {
        throw new Error('Upload failed');
    }

    const { data: uploadData, error: uploadError } = await supabase.from('uploads').insert({
        user: user.id,
        kind: file.type,
        key: filePath,
        status: 'preparing',
        handled: false,
        error: false,
        error_text: null
    }).select().single();

    const { data: videoData, error: videoError } = await supabase.from('videos').insert({
        user: user.id,
        upload_id: uploadData.id,
        slug: nanoid(11),
    }).select().single();


    if (uploadError) {
        console.error('Error inserting upload record:', uploadError);
        throw new Error('Failed to create upload record');
    }

    return videoData;
}