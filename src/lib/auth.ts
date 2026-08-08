/**
 * Autenticación y construcción de la sesión de aplicación.
 *
 * Traduce la sesión cruda de Supabase al `AppSession` que consume la interfaz,
 * resolviendo el rol siempre desde la tabla `profiles`.
 */

import type { Session } from '@supabase/supabase-js';

import { AppError, toAppError } from './errors';
import { fetchProfileById, upsertProfile } from '../services/profiles';
import { isSupabaseConfigured, requireSupabase, supabase } from './supabase';
import type { AppRole, AppSession } from '../types';

/**
 * Rol tentativo deducido del correo.
 *
 * Es un atajo de desarrollo para poder probar los distintos paneles sin
 * sembrar perfiles a mano. En producción nunca decide el acceso: la fuente de
 * verdad es `profiles.role` y, por debajo, las políticas RLS.
 */
function resolveRoleFromEmail(email: string): AppRole {
    if (!import.meta.env.DEV) {
        return 'student';
    }

    const normalized = email.toLowerCase();

    if (normalized.includes('admin')) return 'admin';
    if (normalized.includes('coord')) return 'coordinator';
    if (normalized.includes('docente') || normalized.includes('teacher')) return 'teacher';
    if (normalized.includes('padre') || normalized.includes('parent')) return 'parent';

    return 'student';
}

/** Convierte una sesión de Supabase en la sesión de la aplicación. */
export async function buildAppSession(supabaseSession: Session | null): Promise<AppSession | null> {
    if (!supabaseSession?.user) {
        return null;
    }

    const userId = supabaseSession.user.id;
    const email = supabaseSession.user.email ?? 'sin-email@arandu.com';

    let profile = null;

    try {
        profile = await fetchProfileById(userId);
    } catch (error) {
        // Un perfil ilegible no debe tumbar la sesión: se degrada al rol mínimo
        // y las políticas RLS siguen protegiendo los datos.
        console.error('[auth] No se pudo leer el perfil del usuario', toAppError(error));
    }

    if (profile && !profile.active) {
        // La cuenta de Supabase sigue siendo válida (el JWT no expira solo
        // porque el perfil se desactivó), así que hay que cerrarla
        // explícitamente para que no vuelva a autenticar en la próxima carga.
        await supabase?.auth.signOut().catch(() => { });
        throw new AppError('account-disabled', 'Tu cuenta ha sido desactivada. Contacta a un administrador para reactivarla.');
    }

    return {
        user: {
            id: userId,
            email,
            name: profile?.name ?? supabaseSession.user.user_metadata?.full_name ?? email,
            role: profile?.role ?? resolveRoleFromEmail(email),
            active: profile?.active ?? true,
        },
        accessToken: supabaseSession.access_token ?? '',
        mode: 'supabase',
    };
}

/** Sesión vigente, leída directamente de Supabase. */
export async function getCurrentSession(): Promise<AppSession | null> {
    if (!isSupabaseConfigured || !supabase) {
        return null;
    }

    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
        return null;
    }

    return buildAppSession(data.session);
}

export async function signInWithPassword(email: string, password: string): Promise<AppSession> {
    const client = requireSupabase();

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
        throw toAppError(error, 'auth');
    }

    const session = data.session ? await buildAppSession(data.session) : null;

    if (!session) {
        throw new AppError('auth', 'No se pudo iniciar la sesión.');
    }

    return session;
}

/**
 * Registra un usuario y crea su perfil.
 *
 * Devuelve `null` cuando el proyecto exige confirmación por correo: la cuenta
 * queda creada pero todavía no hay sesión.
 */
export async function signUpWithPassword(email: string, password: string): Promise<AppSession | null> {
    const client = requireSupabase();

    const { data, error } = await client.auth.signUp({ email, password });

    if (error) {
        throw toAppError(error, 'auth');
    }

    if (!data.user) {
        throw new AppError('unknown', 'Supabase creó la cuenta pero no devolvió el usuario.');
    }

    if (!data.session) {
        // Sin sesión no hay JWT, así que la RLS de `profiles` rechazaría el
        // insert. El perfil se crea en el primer inicio de sesión.
        return null;
    }

    const userEmail = data.user.email ?? email;

    await upsertProfile({
        id: data.user.id,
        email: userEmail,
        fullName: data.user.user_metadata?.full_name ?? userEmail,
        role: resolveRoleFromEmail(userEmail),
    });

    return buildAppSession(data.session);
}

export async function signOut(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
        return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
        throw toAppError(error, 'auth');
    }
}

/**
 * Suscribe a los cambios de autenticación. Devuelve la función para cancelar.
 *
 * `blockedMessage` solo llega cuando la sesión se cerró porque la cuenta está
 * desactivada; distinguirlo le permite a la interfaz mostrar por qué en vez de
 * un cierre de sesión silencioso.
 */
export function subscribeToAuthChanges(
    callback: (session: AppSession | null, blockedMessage?: string) => void,
): () => void {
    if (!isSupabaseConfigured || !supabase) {
        return () => { };
    }

    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, supabaseSession) => {
        try {
            callback(await buildAppSession(supabaseSession));
        } catch (error) {
            const appError = toAppError(error);

            if (appError.kind === 'account-disabled') {
                callback(null, appError.message);
                return;
            }

            console.error('[auth] No se pudo reconstruir la sesión', appError);
            callback(null);
        }
    });

    return () => subscription.unsubscribe();
}
