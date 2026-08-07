import { useEffect, useMemo, useState } from 'react';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import TextContent from '@cloudscape-design/components/text-content';

import CloudscapeDashboardLayout from '../../../layouts/CloudscapeDashboardLayout';
import RoleProtectedRoute from '../../../routes/RoleProtectedRoute';
import { getAllowedRolesForPath, getDefaultDashboardPathForRole, getNavigationItemsForRole } from '../../../routes/navigationConfig';
import type { AppSession } from '../../../types';
import type { AppRole } from '../../../types';

interface DashboardMainProps {
    session: AppSession;
    loading: boolean;
    onSignOut: () => Promise<void>;
}

function AdminPanel() {
    return (
        <Container header={<Header variant="h2">Panel administrativo</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Visión general del equipo y roles</h3>
                    <p>Monitorea usuarios, políticas y seguridad desde un solo lugar.</p>
                </TextContent>
                <Box>Contenido específico para administrador.</Box>
            </SpaceBetween>
        </Container>
    );
}

function TeacherOverview() {
    return (
        <Container header={<Header variant="h2">Panel docente</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Indicadores de clase y desempeño</h3>
                    <p>Accede a tus tareas, cursos y actividades recientes.</p>
                </TextContent>
                <Box>Contenido específico para docente.</Box>
            </SpaceBetween>
        </Container>
    );
}

function StudentProgress() {
    return (
        <Container header={<Header variant="h2">Progreso del estudiante</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Progreso académico</h3>
                    <p>Revisa calificaciones, tareas y avances semanales.</p>
                </TextContent>
                <Box>Contenido específico para estudiante/parent.</Box>
            </SpaceBetween>
        </Container>
    );
}

function ActivitiesPanel() {
    return (
        <Container header={<Header variant="h2">Actividad reciente</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Últimos eventos</h3>
                    <p>Registra las acciones recientes y cambios importantes del sistema.</p>
                </TextContent>
                <Box>Actividad reciente y auditoría.</Box>
            </SpaceBetween>
        </Container>
    );
}

function TasksPanel() {
    return (
        <Container header={<Header variant="h2">Mis tareas</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Tareas pendientes</h3>
                    <p>Revisa los procesos pendientes de aprobación y las actividades asignadas.</p>
                </TextContent>
                <Box>Tareas y recordatorios.</Box>
            </SpaceBetween>
        </Container>
    );
}

function SecurityPanel() {
    return (
        <Container header={<Header variant="h2">Seguridad</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Control de acceso y roles</h3>
                    <p>Gestiona permisos, políticas y reglas de seguridad.</p>
                </TextContent>
                <Box>Resumen de seguridad.</Box>
            </SpaceBetween>
        </Container>
    );
}

function NotFoundPanel() {
    return (
        <Container header={<Header variant="h2">Página no encontrada</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Sección no encontrada</h3>
                    <p>La ruta solicitada no corresponde a ninguna vista del dashboard.</p>
                </TextContent>
            </SpaceBetween>
        </Container>
    );
}

const ROLE_VIEWS: Record<string, React.ReactNode> = {
    '/dashboard/overview': <AdminPanel />,
    '/dashboard/activities': <ActivitiesPanel />,
    '/dashboard/my-tasks': <TasksPanel />,
    '/dashboard/progress': <StudentProgress />,
    '/dashboard/security': <SecurityPanel />,
};

export default function DashboardMain({ session, loading, onSignOut }: DashboardMainProps) {
    const [activePath, setActivePath] = useState(() => {
        const pathname = window.location.pathname;
        return pathname.startsWith('/dashboard')
            ? pathname
            : getDefaultDashboardPathForRole(session.user.role);
    });

    useEffect(() => {
        const pathname = window.location.pathname;
        if (!pathname.startsWith('/dashboard')) {
            const defaultPath = getDefaultDashboardPathForRole(session.user.role);
            window.history.replaceState(null, '', defaultPath);
            setActivePath(defaultPath);
            return;
        }

        setActivePath(pathname);
    }, [session.user.role]);

    useEffect(() => {
        const handlePopState = () => {
            const pathname = window.location.pathname;
            if (pathname.startsWith('/dashboard')) {
                setActivePath(pathname);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigationItems = useMemo(() => getNavigationItemsForRole(session.user.role), [session.user.role]);
    const allowedRoles = useMemo(() => getAllowedRolesForPath(activePath), [activePath]);

    const activeHref = navigationItems.some((item) => item.href === activePath)
        ? activePath
        : getDefaultDashboardPathForRole(session.user.role);

    const viewToRender = ROLE_VIEWS[activePath] ?? <NotFoundPanel />;

    const handleNavigation = (href: string) => {
        if (href === activePath) return;
        window.history.pushState(null, '', href);
        setActivePath(href);
    };

    return (
        <CloudscapeDashboardLayout
            session={session}
            navigationItems={navigationItems}
            activeHref={activeHref}
            onNavigation={handleNavigation}
            onSignOut={onSignOut}
            title="Dashboard configurable"
            subtitle={`Bienvenido, ${session.user.name}. Tu rol es ${session.user.role}.`}
        >
            <RoleProtectedRoute session={session} loading={loading} allowedRoles={allowedRoles}>
                {viewToRender}
            </RoleProtectedRoute>
        </CloudscapeDashboardLayout>
    );
}
