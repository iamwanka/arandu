import { useMemo } from 'react';

import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Spinner from '@cloudscape-design/components/spinner';
import { TextContent } from '@cloudscape-design/components';

import '@cloudscape-design/global-styles/index.css';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import DashboardMain from './features/dashboard/views/DashboardMain';
import AuthPanel from './features/auth/AuthPanel';

function AppContent() {
  const { session, loading, signOut } = useAuthContext();
  const heading = useMemo(() => (session ? 'Panel de control' : 'Autenticación y acceso'), [session]);

  if (loading) {
    return (
      <div className="app-shell loading-state">
        <Spinner size="large" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <Header variant="h1">Sprint 1 · Arandu</Header>

        <Container>
          <div className="hero-panel">
            <SpaceBetween size="l">
              <TextContent>
                <h2>{heading}</h2>
                <p>
                  Este sprint incorpora login, registro, administración de roles y un modelo de RLS básico
                  con arquitectura modular para escalar hacia matrículas, calificaciones y módulos académicos.
                </p>
              </TextContent>

              <Box variant="div">
                <SpaceBetween size="s">
                  <strong>Arquitectura base</strong>
                  <span>• Frontend React + Vite + Cloudscape para una UI consistente y mantenible</span>
                  <span>• Auth y sesión centralizados en una capa de dominio reutilizable</span>
                  <span>• Roles y permisos desacoplados para facilitar futuras políticas de acceso</span>
                </SpaceBetween>
              </Box>
            </SpaceBetween>
          </div>

          <div className="form-panel">
            <AuthPanel />
          </div>
        </Container>

        <Container header={<Header variant="h2">Qué incluye este sprint</Header>}>
          <SpaceBetween size="m">
            <Alert type="info">Inicia sesión para ver el panel de administración y la capa de permisos.</Alert>
            <Box variant="div">
              <div className="module-pill">Login y registro con feedback de estado</div>
              <div className="module-pill">Gestión de roles por usuario</div>
              <div className="module-pill">Políticas RLS documentadas para expansión</div>
            </Box>
          </SpaceBetween>
        </Container>
      </div>
    );
  }

  return <DashboardMain session={session} loading={loading} onSignOut={signOut} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
