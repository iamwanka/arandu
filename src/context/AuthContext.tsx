import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
    getCurrentSession,
    signInWithPassword as authSignIn,
    signOut as authSignOut,
    signUpWithPassword as authSignUp,
    subscribeToAuthChanges,
} from '../lib/auth';
import { toAppError } from '../lib/errors';
import { isSupabaseConfigured } from '../lib/supabase';
import type { AppSession } from '../types';
import { AuthContext } from './authContextBase';

/**
 * Única fuente de la sesión en la aplicación.
 *
 * Toda la conversación con Supabase pasa por `lib/auth`; aquí solo se mantiene
 * el estado de React y se atiende la suscripción a cambios de autenticación.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<AppSession | null>(null);
    const [loading, setLoading] = useState(isSupabaseConfigured);
    const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

    useEffect(() => {
        // Sin Supabase configurado no hay sesión que resolver: `loading` ya
        // arrancó en `false` (ver el useState de arriba), así que no hace
        // falta tocar el estado aquí.
        if (!isSupabaseConfigured) {
            return;
        }

        let mounted = true;

        void getCurrentSession()
            .then((currentSession) => {
                if (mounted) setSession(currentSession);
            })
            .catch((error) => {
                if (!mounted) return;

                setSession(null);

                const appError = toAppError(error);
                if (appError.kind === 'account-disabled') {
                    setBlockedMessage(appError.message);
                } else {
                    console.error('[auth] No se pudo inicializar la sesión', appError);
                }
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        const unsubscribe = subscribeToAuthChanges((nextSession, blocked) => {
            if (!mounted) return;
            setSession(nextSession);
            setLoading(false);
            if (blocked) setBlockedMessage(blocked);
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    const signInWithPassword = useCallback(async (email: string, password: string) => {
        setBlockedMessage(null);
        const nextSession = await authSignIn(email, password);
        setSession(nextSession);
        return nextSession;
    }, []);

    const signUpWithPassword = useCallback(async (email: string, password: string) => {
        setBlockedMessage(null);
        const nextSession = await authSignUp(email, password);
        setSession(nextSession);
        return nextSession;
    }, []);

    const signOut = useCallback(async () => {
        await authSignOut();
        setSession(null);
    }, []);

    const value = useMemo(
        () => ({ session, loading, blockedMessage, signInWithPassword, signUpWithPassword, signOut }),
        [session, loading, blockedMessage, signInWithPassword, signUpWithPassword, signOut],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
