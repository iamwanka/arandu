import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import { AppError } from './errors';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type AranduSupabaseClient = SupabaseClient<Database>;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase: AranduSupabaseClient | null = isSupabaseConfigured
    ? createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })
    : null;

if (!isSupabaseConfigured && import.meta.env.DEV) {
    console.warn(
        '[supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. ' +
        'La aplicación funcionará sin acceso a datos hasta configurarlas.',
    );
}

/**
 * Devuelve el cliente ya validado.
 *
 * Los servicios lo usan como primera línea para no repetir la comprobación de
 * configuración ni el `null` check en cada consulta.
 */
export function requireSupabase(): AranduSupabaseClient {
    if (!supabase) {
        throw new AppError(
            'config',
            'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.',
        );
    }

    return supabase;
}
