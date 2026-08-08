import { createContext, useContext } from 'react';

import type { AppSession } from '../types';

export interface AuthContextValue {
    session: AppSession | null;
    /** `true` mientras se resuelve la sesión inicial. */
    loading: boolean;
    /**
     * Explica por qué la sesión se cerró sola (cuenta desactivada), a
     * diferencia de un cierre de sesión normal donde no hay nada que explicar.
     */
    blockedMessage: string | null;
    signInWithPassword: (email: string, password: string) => Promise<AppSession | null>;
    signUpWithPassword: (email: string, password: string) => Promise<AppSession | null>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuthContext(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuthContext debe usarse dentro de un AuthProvider.');
    }

    return context;
}
