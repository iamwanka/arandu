/**
 * Registro único de rutas del dashboard.
 *
 * Es la fuente de verdad para tres cosas que antes vivían en archivos
 * distintos: qué secciones existen, quién puede verlas y cómo se arman los
 * elementos de la navegación lateral. Agregar un módulo nuevo consiste en
 * añadir una entrada aquí y registrar su vista en `DashboardMain`.
 */

import type { SideNavigationProps } from '@cloudscape-design/components/side-navigation';

import type { Permission } from '../lib/roles';
import { ALL_ROLES, STAFF_ROLES, type AppRole } from '../types';

/** `planned` marca módulos previstos en el plan de sprints pero aún sin implementar. */
export type RouteStatus = 'ready' | 'planned';

export interface AppRoute {
    id: string;
    path: string;
    label: string;
    /** Texto de apoyo mostrado en la navegación y como descripción de la vista. */
    description: string;
    /** Roles con acceso. Es el control efectivo en el cliente; el respaldo real es RLS. */
    roles: AppRole[];
    /** Permiso adicional requerido, cuando el rol no basta para expresar la regla. */
    permission?: Permission;
    status: RouteStatus;
    /** Sprint del plan que entrega o completa la sección. */
    sprint: number;
}

export const DASHBOARD_ROOT = '/dashboard';

export const APP_ROUTES: AppRoute[] = [
    {
        id: 'overview',
        path: '/dashboard/overview',
        label: 'Resumen',
        description: 'Vista general del sistema y accesos rápidos según tu rol.',
        roles: ALL_ROLES,
        status: 'ready',
        sprint: 0,
    },
    {
        id: 'users',
        path: '/dashboard/users',
        label: 'Usuarios y roles',
        description: 'Gestión de cuentas, asignación de roles y permisos.',
        roles: ['admin'],
        permission: 'manage-roles',
        status: 'ready',
        sprint: 1,
    },
    {
        id: 'students',
        path: '/dashboard/students',
        label: 'Estudiantes',
        description: 'Listado, creación y edición de estudiantes y sus acudientes.',
        roles: ['admin', 'coordinator'],
        permission: 'manage-students',
        status: 'ready',
        sprint: 2,
    },
    {
        id: 'teachers',
        path: '/dashboard/teachers',
        label: 'Docentes',
        description: 'Registro de docentes, especialidad y datos de contacto.',
        roles: ['admin', 'coordinator'],
        permission: 'manage-teachers',
        status: 'ready',
        sprint: 2,
    },
    {
        id: 'academic',
        path: '/dashboard/academic',
        label: 'Académico',
        description: 'Asignaturas, periodos y proceso de matrícula.',
        roles: ['admin', 'coordinator'],
        permission: 'manage-academic',
        status: 'ready',
        sprint: 3,
    },
    {
        id: 'progress',
        path: '/dashboard/progress',
        label: 'Progreso',
        description: 'Calificaciones, asistencia, disciplina e indicadores de desempeño.',
        roles: STAFF_ROLES.concat(['student', 'parent']),
        status: 'ready',
        sprint: 4,
    },
    {
        id: 'schedules',
        path: '/dashboard/schedules',
        label: 'Horarios',
        description: 'Horario por grado, día y asignatura. Editable solo para admin y coordinador.',
        roles: ALL_ROLES,
        status: 'ready',
        sprint: 5,
    },
    {
        id: 'reports',
        path: '/dashboard/reports',
        label: 'Reportes',
        description: 'Boletines, reportes institucionales y documentos descargables.',
        roles: ['admin', 'coordinator'],
        permission: 'view-reports',
        status: 'ready',
        sprint: 6,
    },
    {
        id: 'security',
        path: '/dashboard/security',
        label: 'Seguridad',
        description: 'Políticas de acceso, RLS y reglas de seguridad por rol.',
        roles: ['admin', 'coordinator'],
        status: 'ready',
        sprint: 1,
    },
];

export function getRouteByPath(path: string): AppRoute | null {
    return APP_ROUTES.find((route) => route.path === path) ?? null;
}

export function getRoutesForRole(role: AppRole): AppRoute[] {
    return APP_ROUTES.filter((route) => route.roles.includes(role));
}

/** Roles autorizados en una ruta. Vacío si la ruta no existe. */
export function getAllowedRolesForPath(path: string): AppRole[] {
    return getRouteByPath(path)?.roles ?? [];
}

export function canRoleAccessPath(role: AppRole, path: string): boolean {
    return getAllowedRolesForPath(path).includes(role);
}

/** Primera ruta disponible para el rol; el resumen está abierto a todos, así que siempre resuelve. */
export function getDefaultPathForRole(role: AppRole): string {
    return getRoutesForRole(role)[0]?.path ?? '/dashboard/overview';
}

export function getNavigationItemsForRole(role: AppRole): SideNavigationProps.Item[] {
    return getRoutesForRole(role).map((route) => ({
        type: 'link',
        text: route.label,
        href: route.path,
        info: route.status === 'planned' ? `Sprint ${route.sprint}` : undefined,
    }));
}
