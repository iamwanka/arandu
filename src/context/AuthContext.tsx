import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  buildAppSession,
  signInWithPassword as authSignIn,
  signUpWithPassword as authSignUp,
} from "../lib/auth";

import type { AppSession } from "../types";

interface AuthContextValue {
  session: AppSession | null;
  loading: boolean;

  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<AppSession | null>;

  signUpWithPassword: (
    email: string,
    password: string
  ) => Promise<AppSession | null>;

  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    async function initialize() {
      try {
        const {
          data: { session: supabaseSession },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !supabaseSession) {
          setSession(null);
          return;
        }

        const appSession = await buildAppSession(supabaseSession);

        if (!mounted) return;

        setSession(appSession);
      } catch (error) {
        console.error("Failed to initialize auth session:", error);

        if (!mounted) return;

        setSession(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, supabaseSession) => {
      if (!mounted) return;

      try {
        if (!supabaseSession) {
          setSession(null);
          return;
        }

        const appSession = await buildAppSession(supabaseSession);

        if (!mounted) return;

        setSession(appSession);
      } catch (error) {
        console.error("Failed to update auth session:", error);

        if (!mounted) return;

        setSession(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const nextSession = await authSignIn(email, password);
      setSession(nextSession);
      return nextSession;
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const nextSession = await authSignUp(email, password);
      setSession(nextSession);
      return nextSession;
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;

    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      signInWithPassword: signIn,
      signUpWithPassword: signUp,
      signOut,
    }),
    [session, loading, signIn, signUp, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used within an AuthProvider"
    );
  }

  return context;
}