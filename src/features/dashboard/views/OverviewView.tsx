import Badge from '@cloudscape-design/components/badge';
import Box from '@cloudscape-design/components/box';
import Header from '@cloudscape-design/components/header';
import Link from '@cloudscape-design/components/link';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';

import { SectionCard } from '../../../components/ui';
import { getRoleLabel } from '../../../lib/roles';
import { getRoutesForRole } from '../../../routes/appRoutes';
import type { AppSession } from '../../../types';
import AdminOverview from './overview/AdminOverview';
import ParentOverview from './overview/ParentOverview';
import StudentOverview from './overview/StudentOverview';
import TeacherOverview from './overview/TeacherOverview';

interface OverviewViewProps {
    session: AppSession;
    onNavigate: (path: string) => void;
}

/** Punto de entrada del dashboard: lo primero que ve cada rol, hecho a su medida. */
export default function OverviewView({ session, onNavigate }: OverviewViewProps) {
    const { role, name } = session.user;
    const plannedRoutes = getRoutesForRole(role).filter((route) => route.status === 'planned');

    const roleWidget =
        role === 'admin' || role === 'coordinator' ? (
            <AdminOverview onNavigate={onNavigate} />
        ) : role === 'teacher' ? (
            <TeacherOverview session={session} onNavigate={onNavigate} />
        ) : role === 'student' ? (
            <StudentOverview onNavigate={onNavigate} />
        ) : (
            <ParentOverview onNavigate={onNavigate} />
        );

    return (
        <SpaceBetween size="l">
            <Header variant="h1" description={`Rol: ${getRoleLabel(role)}`}>
                Hola, {name.split(' ')[0]}
                <Box display="inline" padding={{ left: 's' }}>
                    <Badge color="blue">{getRoleLabel(role)}</Badge>
                </Box>
            </Header>

            {roleWidget}

            {plannedRoutes.length > 0 ? (
                <SectionCard title="Próximamente" description="Módulos ya definidos para tu rol, pendientes de construir.">
                    <SpaceBetween size="s">
                        {plannedRoutes.map((route) => (
                            <Box key={route.id}>
                                <Link
                                    href={route.path}
                                    onFollow={(event) => {
                                        event.preventDefault();
                                        onNavigate(route.path);
                                    }}
                                >
                                    {route.label}
                                </Link>{' '}
                                <StatusIndicator type="pending">Sprint {route.sprint}</StatusIndicator>
                                <Box color="text-body-secondary">{route.description}</Box>
                            </Box>
                        ))}
                    </SpaceBetween>
                </SectionCard>
            ) : null}
        </SpaceBetween>
    );
}
