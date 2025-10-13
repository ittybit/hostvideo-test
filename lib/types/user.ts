import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User extends SupabaseUser {
    profile?: {
        username: string;
        name: string;
        bio: string;
    };
}