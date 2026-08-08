import { useCallback, useState } from 'react';

/**
 * Estado sincronizado con `localStorage`.
 *
 * Adaptado del patrón que usan los propios demos de Cloudscape
 * (`use-local-storage.ts`) para preferencias de interfaz: tamaño de página de
 * una tabla, columnas visibles, tamaño de un split panel, etc. No es para
 * datos de negocio — esos siempre vienen de Supabase.
 *
 * ```ts
 * const [pageSize, setPageSize, resetPageSize] = useLocalStorage('arandu-users-page-size', 20);
 * ```
 */
export function useLocalStorage<T>(key: string, defaultValue: T): readonly [T, (value: T) => void, () => void] {
    const [value, setValue] = useState<T>(() => readStorage(key) ?? defaultValue);

    const handleChange = useCallback(
        (nextValue: T) => {
            setValue(nextValue);
            writeStorage(key, nextValue);
        },
        [key],
    );

    const handleReset = useCallback(() => {
        setValue(defaultValue);
        removeStorage(key);
        // `defaultValue` se captura deliberadamente solo en el montaje: si
        // cambiara entre renders, resetear no debería depender de esa
        // referencia inestable. Los consumidores le pasan un literal.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    return [value, handleChange, handleReset] as const;
}

function readStorage<T>(key: string): T | undefined {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
        return undefined;
    }
}

function writeStorage<T>(key: string, value: T): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // localStorage puede fallar en modo privado o por cuota llena; la
        // preferencia simplemente no persiste, no es un error que bloquee la UI.
    }
}

function removeStorage(key: string): void {
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Ver nota en writeStorage.
    }
}
