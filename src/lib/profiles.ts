import { supabase, isSupabaseConfigured } from './supabase';
import type { AppRole, AppUser } from '../types';

const PROFILE_COLUMNS = 'id,email,full_name,role';

function normalizeProfile(row: any): AppUser {
    return {
        id: row.id,
        email: row.email,
        name: row.full_name ?? row.email,
        role: row.role as AppRole,
    };
}

export async function fetchProfileById(id: string): Promise<AppUser | null> {
    if (!supabase || !isSupabaseConfigured) {
        console.warn('[profiles] fetchProfileById called without Supabase configured', { id });
        return null;
    }

    console.info('[profiles] fetchProfileById', { id });
    const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', id).single();
    console.debug('[profiles] fetchProfileById response', { data, error });
    if (error) {
        throw error;
    }

    return data ? normalizeProfile(data) : null;
}

export async function fetchProfileByEmail(email: string): Promise<AppUser | null> {
    if (!supabase || !isSupabaseConfigured) {
        console.warn('[profiles] fetchProfileByEmail called without Supabase configured', { email });
        return null;
    }

    console.info('[profiles] fetchProfileByEmail', { email });
    const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('email', email).single();
    console.debug('[profiles] fetchProfileByEmail response', { data, error });
    if (error) {
        throw error;
    }

    return data ? normalizeProfile(data) : null;
}

export async function listProfiles(): Promise<AppUser[]> {
    if (!supabase || !isSupabaseConfigured) {
        throw new Error('Supabase no está configurado.');
    }

    console.info('[profiles] listProfiles');
    const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS);
    console.debug('[profiles] listProfiles response', { data, error });
    if (error) {
        throw error;
    }

    return (data ?? []).map(normalizeProfile);
}

export async function upsertProfile(profile: { id: string; email: string; full_name: string; role: AppRole }): Promise<AppUser> {
    if (!supabase || !isSupabaseConfigured) {
        throw new Error('Supabase no está configurado.');
    }

    console.info('[profiles] upsertProfile', profile);
    const { data, error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' })
        .select(PROFILE_COLUMNS)
        .single();
    console.debug('[profiles] upsertProfile response', { data, error });

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error('No se pudo guardar el perfil.');
    }

    return normalizeProfile(data);
}

export async function updateProfileRole(email: string, role: AppRole): Promise<AppUser> {
    if (!supabase || !isSupabaseConfigured) {
        throw new Error('Supabase no está configurado.');
    }

    console.info('[profiles] updateProfileRole', { email, role });
    const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('email', email)
        .select(PROFILE_COLUMNS)
        .single();
    console.debug('[profiles] updateProfileRole response', { data, error });

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error('No se encontró el perfil para actualizar.');
    }

    return normalizeProfile(data);
}
