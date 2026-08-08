/**
 * Manejo unificado de errores.
 *
 * Toda la capa de servicios lanza `AppError`, de modo que las vistas muestran
 * siempre un mensaje en español legible sin tener que inspeccionar la forma del
 * error que devuelve Supabase.
 */

export type AppErrorKind =
    | 'config'            // Supabase no está configurado
    | 'auth'              // credenciales o sesión inválida
    | 'permission'        // el rol no tiene acceso (RLS)
    | 'account-disabled'  // el perfil existe pero fue desactivado por un administrador
    | 'not-found'         // el recurso no existe
    | 'conflict'          // violación de unicidad u otra regla de negocio
    | 'validation'        // datos inválidos enviados por el usuario
    | 'network'           // fallo de conexión
    | 'unknown';

export class AppError extends Error {
    readonly kind: AppErrorKind;
    readonly cause?: unknown;

    constructor(kind: AppErrorKind, message: string, cause?: unknown) {
        super(message);
        this.name = 'AppError';
        this.kind = kind;
        this.cause = cause;
    }
}

const MESSAGES_BY_KIND: Record<AppErrorKind, string> = {
    config: 'Supabase no está configurado. Revisa las variables de entorno.',
    auth: 'Tu sesión no es válida. Inicia sesión nuevamente.',
    permission: 'Tu rol no tiene permisos para realizar esta acción.',
    'account-disabled': 'Tu cuenta ha sido desactivada. Contacta a un administrador para reactivarla.',
    'not-found': 'No se encontró el registro solicitado.',
    conflict: 'El registro ya existe o entra en conflicto con otro.',
    validation: 'Los datos enviados no son válidos.',
    network: 'No se pudo conectar con el servidor. Revisa tu conexión.',
    unknown: 'Ocurrió un error inesperado. Intenta de nuevo.',
};

/**
 * Códigos de PostgREST/Postgres que sabemos traducir.
 * Referencia: https://postgrest.org/en/stable/references/errors.html
 */
const KIND_BY_PG_CODE: Record<string, AppErrorKind> = {
    '23505': 'conflict',     // unique_violation
    '23503': 'conflict',     // foreign_key_violation
    '23514': 'validation',   // check_violation
    '23502': 'validation',   // not_null_violation
    '22P02': 'validation',   // invalid_text_representation
    '42501': 'permission',   // insufficient_privilege
    PGRST116: 'not-found',   // no rows para .single()
    PGRST301: 'auth',        // JWT inválido o expirado
};

const MESSAGE_PATTERNS: Array<{ pattern: RegExp; kind: AppErrorKind; message: string }> = [
    {
        pattern: /invalid login credentials/i,
        kind: 'auth',
        message: 'Correo o contraseña incorrectos.',
    },
    {
        pattern: /email not confirmed/i,
        kind: 'auth',
        message: 'Debes confirmar tu correo antes de iniciar sesión.',
    },
    {
        pattern: /user already registered/i,
        kind: 'conflict',
        message: 'Ya existe una cuenta registrada con ese correo.',
    },
    {
        pattern: /password should be at least/i,
        kind: 'validation',
        message: 'La contraseña es demasiado corta.',
    },
    {
        pattern: /row-level security/i,
        kind: 'permission',
        message: MESSAGES_BY_KIND.permission,
    },
    {
        pattern: /failed to fetch|network ?error/i,
        kind: 'network',
        message: MESSAGES_BY_KIND.network,
    },
];

function readProperty(value: unknown, key: string): string | undefined {
    if (typeof value !== 'object' || value === null) return undefined;
    const raw = (value as Record<string, unknown>)[key];
    return typeof raw === 'string' ? raw : undefined;
}

/**
 * Normaliza cualquier error (Supabase, PostgREST, `Error`, string) a `AppError`.
 * Es idempotente: si ya recibe un `AppError`, lo devuelve tal cual.
 */
export function toAppError(error: unknown, fallbackKind: AppErrorKind = 'unknown'): AppError {
    if (error instanceof AppError) {
        return error;
    }

    const code = readProperty(error, 'code');
    const rawMessage = readProperty(error, 'message') ?? (typeof error === 'string' ? error : undefined);

    if (rawMessage) {
        const match = MESSAGE_PATTERNS.find((entry) => entry.pattern.test(rawMessage));
        if (match) {
            return new AppError(match.kind, match.message, error);
        }
    }

    if (code && KIND_BY_PG_CODE[code]) {
        const kind = KIND_BY_PG_CODE[code];
        return new AppError(kind, MESSAGES_BY_KIND[kind], error);
    }

    return new AppError(fallbackKind, rawMessage ?? MESSAGES_BY_KIND[fallbackKind], error);
}

/** Mensaje listo para mostrar en una alerta. */
export function getErrorMessage(error: unknown): string {
    return toAppError(error).message;
}
