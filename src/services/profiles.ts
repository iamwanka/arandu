/**
 * Servicio de perfiles.
 *
 * `profiles` no usa la fábrica genérica porque su `id` no lo genera la base de
 * datos: es el mismo identificador de `auth.users`. Además la administración de
 * roles se hace por correo, que es la clave natural con la que trabaja el panel
 * de usuarios.
 */

import { toAppError, AppError } from '../lib/errors';
import { toAppUser, toProfile } from '../lib/mappers';
import { requireSupabase } from '../lib/supabase';
import type { AppRole, AppUser, Profile } from '../types';

export async function fetchProfileById(id: string): Promise<Profile | null> {
    const client = requireSupabase();

    const { data, error } = await client.from('profiles').select('*').eq('id', id).maybeSingle();

    if (error) {
        throw toAppError(error);
    }

    return data ? toProfile(data) : null;
}

export async function fetchProfileByEmail(email: string): Promise<Profile | null> {
    const client = requireSupabase();

    const { data, error } = await client.from('profiles').select('*').eq('email', email).maybeSingle();

    if (error) {
        throw toAppError(error);
    }

    return data ? toProfile(data) : null;
}

export async function listProfiles(): Promise<AppUser[]> {
    const client = requireSupabase();

    const { data, error } = await client.from('profiles').select('*').order('email');

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toAppUser);
}

/**
 * Perfiles con un rol específico, p. ej. para elegir a qué cuenta vincular un
 * registro de estudiante o docente nuevo. El rol se asigna desde "Usuarios y
 * roles"; este servicio no lo cambia.
 */
export async function listProfilesByRole(role: AppRole): Promise<AppUser[]> {
    const client = requireSupabase();

    const { data, error } = await client.from('profiles').select('*').eq('role', role).order('email');

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toAppUser);
}

export async function upsertProfile(profile: {
    id: string;
    email: string;
    fullName: string;
    role: AppRole;
    phone?: string | null;
}): Promise<AppUser> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('profiles')
        .upsert(
            {
                id: profile.id,
                email: profile.email,
                full_name: profile.fullName,
                role: profile.role,
                phone: profile.phone ?? null,
            },
            { onConflict: 'id' },
        )
        .select('*')
        .single();

    if (error) {
        throw toAppError(error);
    }

    if (!data) {
        throw new AppError('unknown', 'No se pudo guardar el perfil.');
    }

    return toAppUser(data);
}

export async function updateProfileRole(email: string, role: AppRole): Promise<AppUser> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('profiles')
        .update({ role })
        .eq('email', email)
        .select('*')
        .single();

    if (error) {
        throw toAppError(error);
    }

    if (!data) {
        throw new AppError('not-found', `No se encontró el perfil de ${email}.`);
    }

    return toAppUser(data);
}

export async function updateProfileActive(email: string, active: boolean): Promise<AppUser> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('profiles')
        .update({ active })
        .eq('email', email)
        .select('*')
        .single();

    if (error) {
        throw toAppError(error);
    }

    if (!data) {
        throw new AppError('not-found', `No se encontró el perfil de ${email}.`);
    }

    return toAppUser(data);
}
