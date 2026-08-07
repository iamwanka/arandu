export type AppRole = 'admin' | 'coordinator' | 'teacher' | 'student' | 'parent';

export interface AppUser {
    id: string;
    email: string;
    name: string;
    role: AppRole;
}

export interface AppSession {
    user: AppUser;
    accessToken: string;
    mode: 'supabase';
}
