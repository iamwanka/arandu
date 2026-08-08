import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '../lib/errors';

export interface AsyncDataState<T> {
    data: T | null;
    /** `true` en la primera carga y en cada recarga. */
    loading: boolean;
    /** Mensaje ya traducido, listo para una alerta. */
    error: string | null;
    /** Vuelve a ejecutar el `fetcher`. */
    reload: () => Promise<void>;
    /** Actualización optimista sin volver a consultar. */
    setData: (updater: T | ((current: T | null) => T | null)) => void;
}

/**
 * Hook estándar de lectura de datos.
 *
 * Unifica los tres estados que toda vista necesita (cargando, error, datos),
 * cancela el resultado si el componente se desmonta o si llega una respuesta
 * obsoleta, y expone `reload` para refrescar tras una mutación.
 *
 * ```ts
 * const { data, loading, error, reload } = useAsyncData(
 *   () => studentsService.list({ search }),
 *   [search],
 * );
 * ```
 *
 * `deps` funciona igual que en `useEffect`: cuando cambia, se relanza la carga.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncDataState<T> {
    const [data, setDataState] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Guardamos el fetcher en una ref para que las vistas puedan pasar una
    // función inline sin provocar recargas en cada render. Se actualiza tras
    // el commit para no mutar la ref durante el render.
    const fetcherRef = useRef(fetcher);
    useEffect(() => {
        fetcherRef.current = fetcher;
    });

    // Descarta respuestas de peticiones que ya fueron reemplazadas.
    const requestIdRef = useRef(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const load = useCallback(async () => {
        const requestId = ++requestIdRef.current;

        setLoading(true);
        setError(null);

        try {
            const result = await fetcherRef.current();

            if (!mountedRef.current || requestId !== requestIdRef.current) return;

            setDataState(result);
        } catch (caught) {
            if (!mountedRef.current || requestId !== requestIdRef.current) return;

            setError(getErrorMessage(caught));
        } finally {
            if (mountedRef.current && requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        // `load` actualiza estado de forma síncrona antes de su primer
        // `await`; se dispara en una microtarea para que esas actualizaciones
        // no ocurran de forma síncrona dentro del propio efecto. `mountedRef`
        // ya protege el caso en que el componente se desmonte antes de que
        // la microtarea corra.
        queueMicrotask(() => void load());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    const setData = useCallback((updater: T | ((current: T | null) => T | null)) => {
        setDataState((current) =>
            typeof updater === 'function' ? (updater as (value: T | null) => T | null)(current) : updater,
        );
    }, []);

    return { data, loading, error, reload: load, setData };
}
