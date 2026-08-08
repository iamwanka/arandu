import type { ReactNode } from 'react';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';

import LoadingState from '../components/ui/LoadingState';
import { getRoleLabel } from '../lib/roles';
import type { AppSession } from '../types';
import type { AppRoute } from './appRoutes';

interface RoleProtectedRouteProps {
    session: AppSession | null;
    loading: boolean;
    /** Ruta solicitada. `null` cuando la URL no corresponde a ninguna sección. */
    route: AppRoute | null;
    /** Vuelve a la sección por defecto del rol. */
    onGoHome?: () => void;
    children: ReactNode;
}

/**
 * Guarda de acceso de una vista del dashboard.
 *
 * Distingue tres situaciones que antes se mezclaban en un mismo mensaje: la
 * sesión aún carga, la ruta no existe, o el rol no tiene permiso. El mensaje de
 * acceso denegado indica el rol actual para que el usuario sepa a quién pedir
 * el cambio.
 */
export default function RoleProtectedRoute({
    session,
    loading,
    route,
    onGoHome,
    children,
}: RoleProtectedRouteProps) {
    if (loading) {
        return <LoadingState text="Verificando tu acceso…" />;
    }

    if (!session) {
        return (
            <Container header={<Header variant="h2">Autenticación requerida</Header>}>
                <Alert type="warning">Necesitas iniciar sesión para acceder al dashboard.</Alert>
            </Container>
        );
    }

    if (!route) {
        return (
            <Container header={<Header variant="h2">Sección no encontrada</Header>}>
                <SpaceBetween size="m">
                    <Alert type="info">La dirección solicitada no corresponde a ninguna sección del dashboard.</Alert>
                    {onGoHome ? <Button onClick={onGoHome}>Volver al inicio</Button> : null}
                </SpaceBetween>
            </Container>
        );
    }

    if (!route.roles.includes(session.user.role)) {
        return (
            <Container header={<Header variant="h2">Acceso denegado</Header>}>
                <SpaceBetween size="m">
                    <Alert type="error" header={`«${route.label}» no está disponible para tu rol`}>
                        Tu rol actual es <strong>{getRoleLabel(session.user.role)}</strong>. Si necesitas acceso a esta
                        sección, solicita el cambio a un administrador.
                    </Alert>
                    <Box color="text-body-secondary">{route.description}</Box>
                    {onGoHome ? <Button onClick={onGoHome}>Volver al inicio</Button> : null}
                </SpaceBetween>
            </Container>
        );
    }

    return <>{children}</>;
}
