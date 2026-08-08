import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';

import { DataTable, SectionCard } from '../../../components/ui';
import RlsPolicyCard from '../../rls/RlsPolicyCard';
import { ROLE_OPTIONS, hasPermission, type Permission } from '../../../lib/roles';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { APP_ROUTES } from '../../../routes/appRoutes';
import type { AppRole } from '../../../types';

interface AccessRow {
    id: string;
    section: string;
    permission: Permission | '—';
    roles: AppRole[];
}

const ACCESS_ROWS: AccessRow[] = APP_ROUTES.map((route) => ({
    id: route.id,
    section: route.label,
    permission: route.permission ?? '—',
    roles: route.roles,
}));

/**
 * Documenta el control de acceso efectivo: qué rol entra a qué sección y con
 * qué permiso, tal como lo declara el registro de rutas. Al leerse del mismo
 * registro que usa la navegación, no puede quedar desactualizado.
 */
export default function SecurityView() {
    return (
        <SpaceBetween size="l">
            <SectionCard
                title="Estado de la plataforma"
                description="Comprobaciones básicas del entorno en el que corre la aplicación."
            >
                <StatusIndicator type={isSupabaseConfigured ? 'success' : 'warning'}>
                    {isSupabaseConfigured
                        ? 'Conexión con Supabase configurada'
                        : 'Supabase sin configurar: define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY'}
                </StatusIndicator>
            </SectionCard>

            <SectionCard
                title="Control de acceso por rol"
                description="Generado a partir del registro de rutas: refleja exactamente lo que aplica la aplicación."
            >
                <DataTable
                    variant="embedded"
                    title="Secciones del dashboard"
                    trackBy="id"
                    items={ACCESS_ROWS}
                    columns={[
                        { id: 'section', header: 'Sección', cell: (item) => item.section },
                        { id: 'permission', header: 'Permiso requerido', cell: (item) => item.permission },
                        ...ROLE_OPTIONS.map((option) => ({
                            id: option.value,
                            header: option.label,
                            cell: (item: AccessRow) =>
                                item.roles.includes(option.value) ? (
                                    <StatusIndicator type="success">Sí</StatusIndicator>
                                ) : (
                                    <StatusIndicator type="stopped">No</StatusIndicator>
                                ),
                        })),
                    ]}
                    emptyTitle="Sin secciones registradas"
                />
            </SectionCard>

            <SectionCard
                title="Permisos por rol"
                description="Capacidades declaradas en la matriz de permisos de la aplicación."
            >
                <DataTable
                    variant="embedded"
                    title="Matriz de permisos"
                    trackBy="value"
                    items={ROLE_OPTIONS}
                    columns={[
                        { id: 'role', header: 'Rol', cell: (item) => item.label },
                        { id: 'description', header: 'Alcance', cell: (item) => item.description },
                        {
                            id: 'reports',
                            header: 'Ver reportes',
                            cell: (item) =>
                                hasPermission(item.value, 'view-reports') ? (
                                    <StatusIndicator type="success">Sí</StatusIndicator>
                                ) : (
                                    <StatusIndicator type="stopped">No</StatusIndicator>
                                ),
                        },
                        {
                            id: 'grades',
                            header: 'Registrar notas',
                            cell: (item) =>
                                hasPermission(item.value, 'manage-grades') ? (
                                    <StatusIndicator type="success">Sí</StatusIndicator>
                                ) : (
                                    <StatusIndicator type="stopped">No</StatusIndicator>
                                ),
                        },
                    ]}
                    emptyTitle="Sin roles definidos"
                />
            </SectionCard>

            <RlsPolicyCard />

            <Box color="text-body-secondary">
                El control por rol en el cliente decide qué se muestra. La autorización efectiva la aplican las
                políticas RLS definidas en <em>supabase/schema.sql</em>.
            </Box>
        </SpaceBetween>
    );
}
