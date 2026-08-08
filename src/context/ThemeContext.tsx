import { useEffect, useState, type ReactNode } from 'react';
import { applyMode, Mode } from '@cloudscape-design/global-styles';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { ThemeContext, type ThemePreference } from './themeContextBase';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/**
 * Tema claro/oscuro/sistema, aplicado globalmente vía la clase `awsui-dark-mode`
 * que `applyMode` alterna en `document.body` — es la misma clase que usan los
 * estilos propios de Cloudscape, así que `index.css` solo necesita un bloque
 * `body.awsui-dark-mode { ... }` para seguirle el paso, sin una segunda clase.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [preference, setPreference] = useLocalStorage<ThemePreference>('arandu-theme', 'system');
    const [systemPrefersDark, setSystemPrefersDark] = useState(
        () => window.matchMedia(DARK_MEDIA_QUERY).matches,
    );

    useEffect(() => {
        const media = window.matchMedia(DARK_MEDIA_QUERY);
        const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);

        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    const isDark = preference === 'dark' || (preference === 'system' && systemPrefersDark);

    useEffect(() => {
        applyMode(isDark ? Mode.Dark : Mode.Light, document.body);
    }, [isDark]);

    return (
        <ThemeContext.Provider value={{ preference, setPreference, isDark }}>{children}</ThemeContext.Provider>
    );
}
