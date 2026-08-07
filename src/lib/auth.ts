import { isSupabaseConfigured, supabase } from "./supabase";

import {
  fetchProfileById,
  listProfiles,
  upsertProfile,
  updateProfileRole,
} from "./profiles";

import type {
  AppRole,
  AppSession,
  AppUser,
} from "../types";

function resolveRoleFromEmail(email: string): AppRole {
  const normalized = email.toLowerCase();

  // Development fallback only.
  // Do NOT use this as the authoritative authorization mechanism.
  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("coord")) return "coordinator";
  if (
    normalized.includes("docente") ||
    normalized.includes("teacher")
  ) {
    return "teacher";
  }
  if (
    normalized.includes("padre") ||
    normalized.includes("parent")
  ) {
    return "parent";
  }

  return "student";
}

/**
 * Transforms a raw Supabase Session into the application's AppSession.
 */
export async function buildAppSession(
  supabaseSession: any
): Promise<AppSession | null> {
  if (!supabaseSession?.user) {
    return null;
  }

  const userId = supabaseSession.user.id;

  const email =
    supabaseSession.user.email ??
    "sin-email@arandu.com";

  console.debug("[auth] Building app session", {
    userId,
    email,
  });

  let profile = null;

  try {
    profile = await fetchProfileById(userId);

    console.debug("[auth] Profile fetched", {
      profile,
    });
  } catch (error) {
    console.error(
      "[auth] Failed to fetch profile",
      {
        userId,
        error,
      }
    );
  }

  const role =
    profile?.role ??
    resolveRoleFromEmail(email);

  const name =
    profile?.name ??
    supabaseSession.user.user_metadata?.full_name ??
    email;

  console.debug("[auth] Resolved user", {
    userId,
    email,
    name,
    role,
    profileExists: !!profile,
  });

  return {
    user: {
      id: userId,
      email,
      name,
      role,
    },
    accessToken:
      supabaseSession.access_token ?? "",
    mode: "supabase",
  };
}

/**
 * Gets the current valid session directly from Supabase.
 */
export async function getCurrentSession(): Promise<AppSession | null> {
  if (!supabase || !isSupabaseConfigured) {
    console.info(
      "[auth] Supabase no está configurado"
    );

    return null;
  }

  const {
    data,
    error,
  } = await supabase.auth.getSession();

  console.debug(
    "[auth] getCurrentSession returned",
    {
      data,
      error,
    }
  );

  if (error || !data.session) {
    return null;
  }

  return buildAppSession(data.session);
}

/**
 * Signs in an existing user.
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AppSession> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error(
      "Supabase no está configurado."
    );
  }

  const {
    data,
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.debug(
    "[auth] signInWithPassword response",
    {
      data,
      error,
    }
  );

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error(
      "No se pudo iniciar la sesión."
    );
  }

  const session =
    await buildAppSession(data.session);

  if (!session) {
    throw new Error(
      "No se pudo construir la sesión de usuario."
    );
  }

  return session;
}

/**
 * Registers a new user and creates their profile.
 */
export async function signUpWithPassword(
  email: string,
  password: string
): Promise<AppSession | null> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error(
      "Supabase no está configurado."
    );
  }

  const {
    data,
    error,
  } = await supabase.auth.signUp({
    email,
    password,
  });

  console.debug(
    "[auth] signUpWithPassword response",
    {
      data,
      error,
    }
  );

  if (error) {
    throw error;
  }

  /**
   * Supabase may return no session when email
   * confirmation is enabled.
   */
  if (!data.session) {
    console.info(
      "[auth] User created but session is not available yet."
    );

    return null;
  }

  const userId = data.user?.id;

  if (!userId) {
    throw new Error(
      "Supabase creó el usuario pero no devolvió su ID."
    );
  }

  const userEmail =
    data.user.email ??
    email;

  const role =
    resolveRoleFromEmail(userEmail);

  const name =
    data.user.user_metadata?.full_name ??
    userEmail;

  /**
   * Create the profile explicitly after registration.
   */
  try {
    await upsertProfile({
      id: userId,
      email: userEmail,
      full_name: name,
      role,
    });

    console.debug(
      "[auth] Profile created successfully",
      {
        userId,
        role,
      }
    );
  } catch (error) {
    console.error(
      "[auth] Failed to create profile",
      {
        userId,
        error,
      }
    );

    throw error;
  }

  /**
   * Now that the profile exists, build the
   * application session.
   */
  const session =
    await buildAppSession(data.session);

  if (!session) {
    throw new Error(
      "No se pudo construir la sesión de usuario tras el registro."
    );
  }

  return session;
}

export async function signOut(): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    return;
  }

  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function listUsers(): Promise<AppUser[]> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error(
      "Supabase no está configurado."
    );
  }

  return listProfiles();
}

export async function updateUserRole(
  email: string,
  role: AppRole
): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error(
      "Supabase no está configurado."
    );
  }

  await updateProfileRole(email, role);
}

/**
 * Subscribes to Supabase authentication changes.
 */
export function subscribeToAuthChanges(
  callback: (
    session: AppSession | null
  ) => void
) {
  if (!supabase || !isSupabaseConfigured) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    async (_event, supabaseSession) => {
      if (!supabaseSession) {
        callback(null);
        return;
      }

      try {
        const appSession =
          await buildAppSession(
            supabaseSession
          );

        callback(appSession);
      } catch (error) {
        console.error(
          "[auth] Failed to build session after auth change",
          error
        );

        callback(null);
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}