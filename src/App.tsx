import Alert from '@cloudscape-design/components/alert';

import '@cloudscape-design/global-styles/index.css';

import LoadingState from './components/ui/LoadingState';
import { AuthProvider } from './context/AuthContext';
import { useAuthContext } from './context/authContextBase';
import { ThemeProvider } from './context/ThemeContext';
import { useThemeContext } from './context/themeContextBase';
import AuthPanel from './features/auth/AuthPanel';
import DashboardMain from './features/dashboard/views/DashboardMain';
import { isSupabaseConfigured } from './lib/supabase';

function LoginThemeToggle() {
    const { preference, setPreference } = useThemeContext();
    const isDark = preference === 'dark';

    return (
        <button
            type="button"
            className="login-theme-toggle"
            onClick={() => setPreference(isDark ? 'light' : 'dark')}
            aria-label="Cambiar tema"
        >
            {isDark ? (
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
            ) : (
                <svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            )}
            {isDark ? 'Claro' : 'Oscuro'}
        </button>
    );
}

function LandingPage({ blockedMessage }: { blockedMessage: string | null }) {
    return (
        <div className="login-page">
            <LoginThemeToggle />

            <section className="login-brand">
                <div className="login-brand-content">
                    <div className="login-logo-frame">
                        <img src="/escudo-institucion.jpg" alt="Escudo de la Institución Educativa Técnico Recreacional Campestre" />
                    </div>

                    <p className="login-eyebrow">Institución Educativa Técnico Recreacional Campestre</p>
                    <h1 className="login-wordmark">Arandu</h1>
                    <p className="login-tagline">
                        La plataforma de gestión escolar de la institución — notas, asistencia y comunicación con la
                        familia, en un solo lugar.
                    </p>

                    <ul className="login-module-list">
                        <li>
                            <svg viewBox="0 0 24 24"><path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" /><path d="M7.5 11.6v4c0 1.4 2 2.6 4.5 2.6s4.5-1.2 4.5-2.6v-4" /></svg>
                            Estudiantes y docentes
                        </li>
                        <li>
                            <svg viewBox="0 0 24 24"><rect x="4" y="13" width="3.4" height="7" rx="1" /><rect x="10.3" y="8.5" width="3.4" height="11.5" rx="1" /><rect x="16.6" y="4" width="3.4" height="16" rx="1" /></svg>
                            Calificaciones y asistencia
                        </li>
                        <li>
                            <svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2.2" /><path d="M3.5 9.5h17" /><path d="M8 3v4M16 3v4" /></svg>
                            Horarios por grado
                        </li>
                        <li>
                            <svg viewBox="0 0 24 24"><path d="M12 3.5 18.5 6v5.5c0 5-3 8-6.5 9-3.5-1-6.5-4-6.5-9V6L12 3.5Z" /><path d="M9.2 12.2l1.9 1.9 3.7-3.9" /></svg>
                            Acceso por roles y RLS
                        </li>
                    </ul>

                    <div className="login-motto">
                        <p>«Educamos, inspiramos y transformamos para construir un mejor mañana»</p>
                        <span>Formación integral · Para la vida</span>
                    </div>
                </div>
            </section>

            <section className="login-form-panel">
                <div className="login-form-card">
                    {blockedMessage || !isSupabaseConfigured ? (
                        <div className="login-alerts">
                            {blockedMessage ? (
                                <Alert type="error" header="Sesión cerrada">
                                    {blockedMessage}
                                </Alert>
                            ) : null}
                            {!isSupabaseConfigured ? (
                                <Alert type="warning" header="Supabase no está configurado">
                                    Copia <code>.env.example</code> a <code>.env.local</code> y define{' '}
                                    <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> para
                                    habilitar el acceso.
                                </Alert>
                            ) : null}
                        </div>
                    ) : null}
                    <AuthPanel />
                </div>
            </section>
        </div>
    );
}

function AppContent() {
    const { session, loading, blockedMessage, signOut } = useAuthContext();

    if (loading) {
        return (
            <div className="app-shell loading-state">
                <LoadingState text="Cargando tu sesión…" />
            </div>
        );
    }

    return session ? (
        <DashboardMain session={session} loading={loading} onSignOut={signOut} />
    ) : (
        <LandingPage blockedMessage={blockedMessage} />
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}
