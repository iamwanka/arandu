import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import TextContent from '@cloudscape-design/components/text-content';

import AdminRolesPanel from '../features/admin/AdminRolesPanel';
import type { AppSession } from '../types';

interface AdminPageProps {
    session: AppSession;
}

export default function AdminPage({ session }: AdminPageProps) {
    return (
        <Container header={<Header variant="h2">Administración</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Gestión de usuarios y roles</h3>
                    <p>Desde este módulo puedes asignar roles y revisar los permisos de los usuarios registrados.</p>
                </TextContent>

                <AdminRolesPanel currentUserEmail={session.user.email} />
            </SpaceBetween>
        </Container>
    );
}
