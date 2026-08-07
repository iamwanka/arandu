import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Spinner from '@cloudscape-design/components/spinner';

import type { AppRole, AppSession } from '../types';

interface RoleProtectedRouteProps {
    session: AppSession | null;
    loading: boolean;
    allowedRoles: AppRole[];
    children: React.ReactNode;
}

export default function RoleProtectedRoute({ session, loading, allowedRoles, children }: RoleProtectedRouteProps) {
    if (loading) {
        return (
            <Box className="app-shell loading-state" padding="l">
                <Spinner size="large" />
            </Box>
        );
    }

    if (!session) {
        return (
            <Container header={<Header variant="h2">Autenticación requerida</Header>}>
                <Alert type="warning">Necesitas iniciar sesión para acceder al dashboard.</Alert>
            </Container>
        );
    }

    if (!allowedRoles.includes(session.user.role)) {
        return (
            <Container header={<Header variant="h2">Acceso denegado</Header>}>
                <Alert type="error">Tu rol no tiene permiso para acceder a esta sección.</Alert>
            </Container>
        );
    }

    return <>{children}</>;
}
