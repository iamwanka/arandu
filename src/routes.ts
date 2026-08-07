import type { AppRole } from './types';

export interface AppRoute {
    id: string;
    label: string;
    description: string;
    allowedRoles: AppRole[];
}

export const APP_ROUTES: AppRoute[] = [
    {
        id: 'dashboard',
        label: 'Inicio',
        description: 'Resumen del sistema y acceso rápido a los módulos activos.',
        allowedRoles: ['admin', 'coordinator', 'teacher', 'student', 'parent'],
    },
    {
        id: 'admin',
        label: 'Usuarios',
        description: 'Gestión de roles y permisos del personal del sistema.',
        allowedRoles: ['admin'],
    },
    {
        id: 'academic',
        label: 'Académico',
        description: 'Módulos de estudiantes, docentes, asignaturas y matrícula.',
        allowedRoles: ['admin', 'coordinator', 'teacher'],
    },
    {
        id: 'reports',
        label: 'Reportes',
        description: 'Generación de reportes académicos y comprobantes.',
        allowedRoles: ['admin', 'coordinator', 'teacher'],
    },
    {
        id: 'rls',
        label: 'Seguridad',
        description: 'Documentación de RLS y control de acceso del sprint.',
        allowedRoles: ['admin', 'coordinator', 'teacher', 'student', 'parent'],
    },
];
