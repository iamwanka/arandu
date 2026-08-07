import type { SideNavigationProps } from '@cloudscape-design/components/side-navigation';

import type { AppRole } from '../types';

export interface DashboardNavigationRoute {
    id: string;
    text: string;
    href: string;
    info: string;
    roles: AppRole[];
}

const DASHBOARD_NAVIGATION_ROUTES: DashboardNavigationRoute[] = [
    {
        id: 'overview',
        text: 'Resumen',
        href: '/dashboard/overview',
        info: 'Resumen ejecutivo del sistema y accesos rápidos',
        roles: ['admin', 'coordinator', 'teacher', 'student', 'parent'],
    },
    {
        id: 'activities',
        text: 'Actividad',
        href: '/dashboard/activities',
        info: 'Últimas acciones y eventos del sistema',
        roles: ['admin', 'coordinator', 'teacher'],
    },
    {
        id: 'my-tasks',
        text: 'Tareas',
        href: '/dashboard/my-tasks',
        info: 'Pendientes, aprobaciones y mensajes importantes',
        roles: ['admin', 'coordinator', 'teacher', 'parent'],
    },
    {
        id: 'progress',
        text: 'Progreso',
        href: '/dashboard/progress',
        info: 'Indicadores de avance por curso y estudiante',
        roles: ['teacher', 'student', 'parent'],
    },
    {
        id: 'security',
        text: 'Seguridad',
        href: '/dashboard/security',
        info: 'Resumen de roles, acceso y políticas de seguridad',
        roles: ['admin', 'coordinator'],
    },
];

export function getNavigationItemsForRole(role: AppRole): SideNavigationProps.Item[] {
    return DASHBOARD_NAVIGATION_ROUTES.filter((route) => route.roles.includes(role)).map((route) => ({
        type: 'link',
        text: route.text,
        href: route.href,
        info: route.info,
    }));
}

export function getAllowedRolesForPath(href: string): AppRole[] {
    return DASHBOARD_NAVIGATION_ROUTES.find((route) => route.href === href)?.roles ?? [];
}

export function getDefaultDashboardPathForRole(role: AppRole): string {
    return DASHBOARD_NAVIGATION_ROUTES.find((route) => route.roles.includes(role))?.href ?? '/dashboard/overview';
}
