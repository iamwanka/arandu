import type { AppRole } from '../types';

export const ROLE_OPTIONS: Array<{ value: AppRole; label: string; description: string }> = [
    { value: 'admin', label: 'Administrador', description: 'Control total y acceso al panel de administración.' },
    { value: 'coordinator', label: 'Coordinador', description: 'Gestiona operaciones académicas y supervisión.' },
    { value: 'teacher', label: 'Docente', description: 'Registra notas y asistencia.' },
    { value: 'student', label: 'Estudiante', description: 'Consulta sus datos y reportes propios.' },
    { value: 'parent', label: 'Padre', description: 'Visualiza información del estudiante asociado.' },
];

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
    admin: ['manage-users', 'manage-roles', 'manage-content', 'view-reports'],
    coordinator: ['manage-content', 'view-reports'],
    teacher: ['manage-grades', 'manage-attendance'],
    student: ['view-own-data'],
    parent: ['view-child-data'],
};

export function getRoleLabel(role: AppRole): string {
    return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function hasPermission(role: AppRole, permission: string): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
}
