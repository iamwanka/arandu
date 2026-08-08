/**
 * Roles y permisos.
 *
 * La matriz de esta capa refleja `docs/funcionalidades-permisos.md` y es la que
 * usan la navegación y las vistas para decidir qué mostrar. No sustituye a las
 * políticas RLS de Supabase: es control de interfaz, la autorización real vive
 * en la base de datos.
 */

import type { AppRole } from '../types';

export type Permission =
    | 'manage-users'
    | 'manage-roles'
    | 'manage-students'
    | 'manage-teachers'
    | 'manage-academic'
    | 'manage-enrollments'
    | 'manage-grades'
    | 'manage-attendance'
    | 'manage-schedules'
    | 'manage-discipline'
    | 'view-reports'
    | 'view-own-data'
    | 'view-child-data';

export interface RoleOption {
    value: AppRole;
    label: string;
    description: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
    { value: 'admin', label: 'Administrador', description: 'Control total y acceso al panel de administración.' },
    { value: 'coordinator', label: 'Coordinador', description: 'Gestiona operaciones académicas y supervisión.' },
    { value: 'teacher', label: 'Docente', description: 'Registra notas, asistencia y observaciones.' },
    { value: 'student', label: 'Estudiante', description: 'Consulta sus datos y reportes propios.' },
    { value: 'parent', label: 'Padre o acudiente', description: 'Visualiza la información del estudiante asociado.' },
];

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
    admin: [
        'manage-users',
        'manage-roles',
        'manage-students',
        'manage-teachers',
        'manage-academic',
        'manage-enrollments',
        'manage-grades',
        'manage-attendance',
        'manage-schedules',
        'manage-discipline',
        'view-reports',
    ],
    coordinator: [
        'manage-students',
        'manage-teachers',
        'manage-academic',
        'manage-enrollments',
        'manage-grades',
        'manage-attendance',
        'manage-schedules',
        'manage-discipline',
        'view-reports',
    ],
    teacher: ['manage-grades', 'manage-attendance', 'manage-discipline'],
    student: ['view-own-data'],
    parent: ['view-child-data'],
};

export function getRoleLabel(role: AppRole): string {
    return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function getRoleDescription(role: AppRole): string {
    return ROLE_OPTIONS.find((option) => option.value === role)?.description ?? '';
}

export function hasPermission(role: AppRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: AppRole): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}
