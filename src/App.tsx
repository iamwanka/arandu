import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import TextContent from '@cloudscape-design/components/text-content';

import '@cloudscape-design/global-styles/index.css';

import LoadingState from './components/ui/LoadingState';
import { AuthProvider } from './context/AuthContext';
import { useAuthContext } from './context/authContextBase';
import { ThemeProvider } from './context/ThemeContext';
import AuthPanel from './features/auth/AuthPanel';
import DashboardMain from './features/dashboard/views/DashboardMain';
import { isSupabaseConfigured } from './lib/supabase';

function LandingPage({ blockedMessage }: { blockedMessage: string | null }) {
    return (
        <div className="app-shell">
            <Header variant="h1">Arandu · Gestión escolar</Header>

            {blockedMessage ? <Alert type="error" header="Sesión cerrada">{blockedMessage}</Alert> : null}

            <Container>
                <div className="hero-panel">
                    <SpaceBetween size="l">
                        <TextContent>
                            <h2>Autenticación y acceso</h2>
                            <p>
                                Plataforma de gestión escolar con acceso por roles, modelo de datos académico y
                                políticas de seguridad a nivel de fila sobre Supabase.
                            </p>
                        </TextContent>

                        <Box variant="div">
                            <SpaceBetween size="s">
                                <strong>Arquitectura base</strong>
                                <span>• React + Vite + Cloudscape para una interfaz consistente</span>
                                <span>• Sesión y roles centralizados en una capa de dominio reutilizable</span>
                                <span>• Servicios de datos tipados sobre Supabase, con RLS como control efectivo</span>
                            </SpaceBetween>
                        </Box>
                    </SpaceBetween>
                </div>

                <div className="form-panel">
                    <AuthPanel />
                </div>
            </Container>

            <Container header={<Header variant="h2">Estado de la plataforma</Header>}>
                <SpaceBetween size="m">
                    {isSupabaseConfigured ? (
                        <Alert type="info">Inicia sesión para acceder a tu panel según el rol asignado.</Alert>
                    ) : (
                        <Alert type="warning" header="Supabase no está configurado">
                            Copia <code>.env.example</code> a <code>.env.local</code> y define{' '}
                            <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> para habilitar
                            el acceso.
                        </Alert>
                    )}

                    <Box variant="div">
                        <div className="module-pill">Login y registro con validación</div>
                        <div className="module-pill">Gestión de usuarios y roles</div>
                        <div className="module-pill">Navegación y permisos por rol</div>
                        <div className="module-pill">Políticas RLS documentadas</div>
                    </Box>
                </SpaceBetween>
            </Container>
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
