import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '../lib/errors';

export interface AsyncActionState<Args extends unknown[], Result> {
    /**
     * Ejecuta la acción. Devuelve el resultado, o `null` si falló: la vista no
     * necesita `try/catch` porque el error ya quedó en `error`.
     */
    run: (...args: Args) => Promise<Result | null>;
    /** `true` mientras la acción está en curso; úsalo en `loading` del botón. */
    pending: boolean;
    error: string | null;
    success: string | null;
    reset: () => void;
}

interface UseAsyncActionOptions<Result> {
    /** Mensaje de éxito, fijo o derivado del resultado. */
    successMessage?: string | ((result: Result) => string);
    onSuccess?: (result: Result) => void | Promise<void>;
    onError?: (message: string) => void;
}

/**
 * Hook estándar de escritura (crear, editar, eliminar, iniciar sesión).
 *
 * Es la contraparte de `useAsyncData`: gestiona el estado de envío y el
 * feedback de éxito/error para que los formularios no lo reimplementen.
 *
 * ```ts
 * const save = useAsyncAction(studentsService.create, {
 *   successMessage: 'Estudiante creado.',
 *   onSuccess: reload,
 * });
 * ```
 */
export function useAsyncAction<Args extends unknown[], Result>(
    action: (...args: Args) => Promise<Result>,
    options: UseAsyncActionOptions<Result> = {},
): AsyncActionState<Args, Result> {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const actionRef = useRef(action);
    const optionsRef = useRef(options);

    // Mantiene siempre la última versión sin forzar a los llamadores a
    // memoizar `action`/`options`. Se actualiza tras el commit, no durante el
    // render, para no mutar una ref mientras React renderiza.
    useEffect(() => {
        actionRef.current = action;
        optionsRef.current = options;
    });

    const run = useCallback(async (...args: Args): Promise<Result | null> => {
        setPending(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await actionRef.current(...args);
            const { successMessage, onSuccess } = optionsRef.current;

            if (successMessage) {
                setSuccess(typeof successMessage === 'function' ? successMessage(result) : successMessage);
            }

            await onSuccess?.(result);

            return result;
        } catch (caught) {
            const message = getErrorMessage(caught);
            setError(message);
            optionsRef.current.onError?.(message);
            return null;
        } finally {
            setPending(false);
        }
    }, []);

    const reset = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    return { run, pending, error, success, reset };
}
