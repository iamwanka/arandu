import { useCallback, useEffect, useState } from 'react';

import type { AppRole } from '../types';
import { canRoleAccessPath, getDefaultPathForRole, getRouteByPath, type AppRoute } from './appRoutes';

export interface AppRouter {
    path: string;
    /** Ruta activa, o `null` si la URL no coincide con ninguna sección. */
    route: AppRoute | null;
    navigate: (path: string) => void;
    goHome: () => void;
}

/**
 * Navegación del dashboard sobre la History API.
 *
 * El proyecto no usa un router externo todavía, así que este hook concentra la
 * poca lógica que hace falta: sincronizar la URL con el estado, responder al
 * botón atrás y redirigir cuando la ruta actual no corresponde al rol.
 * Cuando se incorpore React Router, esta es la única pieza a sustituir.
 */
export function useAppRouter(role: AppRole): AppRouter {
    const [path, setPath] = useState(() => resolveInitialPath(role));

    // El rol puede cambiar bajo el mismo componente montado (p. ej. tras
    // reasignar el rol propio desde el panel de usuarios). Cuando eso pasa, la
    // ruta activa se recalcula durante el render en lugar de en un efecto:
    // es el patrón que React recomienda para "ajustar estado cuando cambia
    // una prop" y evita una vuelta de render extra.
    const [roleForPath, setRoleForPath] = useState(role);
    if (role !== roleForPath) {
        setRoleForPath(role);
        const resolved = resolveInitialPath(role);
        if (resolved !== window.location.pathname) {
            window.history.replaceState(null, '', resolved);
        }
        setPath(resolved);
    }

    const navigate = useCallback((nextPath: string) => {
        setPath((current) => {
            if (current === nextPath) return current;
            window.history.pushState(null, '', nextPath);
            return nextPath;
        });
    }, []);

    const goHome = useCallback(() => {
        const home = getDefaultPathForRole(role);
        window.history.replaceState(null, '', home);
        setPath(home);
    }, [role]);

    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    return { path, route: getRouteByPath(path), navigate, goHome };
}

function resolveInitialPath(role: AppRole): string {
    const pathname = window.location.pathname;

    if (getRouteByPath(pathname) && canRoleAccessPath(role, pathname)) {
        return pathname;
    }

    return getDefaultPathForRole(role);
}
