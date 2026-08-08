import { createContext, useContext } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
    preference: ThemePreference;
    setPreference: (preference: ThemePreference) => void;
    /** Modo efectivamente aplicado, ya resuelto cuando la preferencia es "system". */
    isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useThemeContext(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useThemeContext debe usarse dentro de un ThemeProvider.');
    }

    return context;
}
