"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Logout() {
    const supabase = createClient();
    
    useEffect(() => {
        // Call signOut when component mounts
        supabase.auth.signOut();
    }, []);

    return <div className="p-4 text-center">Logging out...</div>;
}