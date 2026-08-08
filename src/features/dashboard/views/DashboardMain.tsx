import { useMemo } from 'react';

import CloudscapeDashboardLayout from '../../../layouts/CloudscapeDashboardLayout';
import RoleProtectedRoute from '../../../routes/RoleProtectedRoute';
import { getNavigationItemsForRole, type AppRoute } from '../../../routes/appRoutes';
import { useAppRouter } from '../../../routes/useAppRouter';
import { getRoleLabel } from '../../../lib/roles';
import type { AppSession } from '../../../types';
import AdminRolesPanel from '../../admin/AdminRolesPanel';
import StudentsPanel from '../../students/StudentsPanel';
import TeachersPanel from '../../teachers/TeachersPanel';
import OverviewView from './OverviewView';
import PlannedModuleView from './PlannedModuleView';
import SecurityView from './SecurityView';

interface DashboardMainProps {
    session: AppSession;
    loading: boolean;
    onSignOut: () => Promise<void>;
}

interface ViewContext {
    session: AppSession;
    route: AppRoute;
    navigate: (path: string) => void;
}

/**
 * Vistas implementadas, indexadas por el `id` de la ruta.
 *
 * Las rutas sin entrada aquí se resuelven con `PlannedModuleView`, que informa
 * en qué sprint llega el módulo. Implementar una sección consiste en agregarle
 * su vista a este mapa.
 */
const VIEWS: Record<string, (context: ViewContext) => React.ReactNode> = {
    overview: ({ session, navigate }) => <OverviewView session={session} onNavigate={navigate} />,
    users: ({ session }) => <AdminRolesPanel currentUserEmail={session.user.email} />,
    students: () => <StudentsPanel />,
    teachers: () => <TeachersPanel />,
    security: () => <SecurityView />,
};

export default function DashboardMain({ session, loading, onSignOut }: DashboardMainProps) {
    const { role, name } = session.user;
    const { path, route, navigate, goHome } = useAppRouter(role);

    const navigationItems = useMemo(() => getNavigationItemsForRole(role), [role]);

    const view = route ? (VIEWS[route.id]?.({ session, route, navigate }) ?? <PlannedModuleView route={route} />) : null;

    return (
        <CloudscapeDashboardLayout
            session={session}
            navigationItems={navigationItems}
            activeHref={path}
            onNavigation={navigate}
            onSignOut={onSignOut}
            title={route?.label ?? 'Dashboard'}
            subtitle={route?.description ?? `Bienvenido, ${name}. Tu rol es ${getRoleLabel(role)}.`}
        >
            <RoleProtectedRoute session={session} loading={loading} route={route} onGoHome={goHome}>
                {view}
            </RoleProtectedRoute>
        </CloudscapeDashboardLayout>
    );
}
