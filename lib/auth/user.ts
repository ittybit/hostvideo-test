"use client";

import { createClient } from "@/lib/supabase/client";


export default async function getUser() {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
        console.error("Error fetching user:", userError);
        return null;
    }

    let profile = null;

    if (userData?.user) {
        const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('*')
            .eq('id', userData.user.id)
            .single();

        if(profileData) {
            profile = profileData;
        }
    }

    return userData?.user ? {
        ...userData.user,
        profile
    } : null;
}

export async function updateUserProfile({
    name,
    username
}: {
    name: string;
    username: string;
}) {
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        console.error("Error fetching user:", userError);
        return { success: false, error: "User not authenticated" };
    }

    // Is username available
    let uname = username.trim().toLowerCase();
    const { data: existingUser, error: existingUserError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('username', uname)
        .neq('id', userData.user.id)
        .single();
        
    if (existingUser) {
        return { success: false, error: "Username already taken" };
    }

    const { data, error } = await supabase
        .from('user_profile')
        .upsert({
            id: userData.user.id,
            name,
            username
        }, { onConflict: 'id' });

    if (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}