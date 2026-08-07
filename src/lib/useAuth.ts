import { useEffect, useState } from 'react';

import { getCurrentSession, subscribeToAuthChanges, signOut as supabaseSignOut } from './auth';
import type { AppSession } from '../types';

export function useAuth() {
    const [session, setSession] = useState<AppSession | null>(null);
    const [initializing, setInitializing] = useState(true);

    const signOut = async () => {
        await supabaseSignOut();
        setSession(null);
    };

    useEffect(() => {
        let active = true;

        const loadSession = async () => {
            const currentSession = await getCurrentSession();
            if (!active) return;
            setSession(currentSession);
            setInitializing(false);
        };

        loadSession();

        const unsubscribe = subscribeToAuthChanges((nextSession) => {
            if (!active) return;
            setSession(nextSession);
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    return {
        session,
        initializing,
        setSession,
        signOut,
    };
}
