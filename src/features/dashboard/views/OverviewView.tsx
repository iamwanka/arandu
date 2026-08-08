import Badge from '@cloudscape-design/components/badge';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Link from '@cloudscape-design/components/link';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';

import { SectionCard } from '../../../components/ui';
import { getPermissions, getRoleDescription, getRoleLabel } from '../../../lib/roles';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { getRoutesForRole } from '../../../routes/appRoutes';
import type { AppSession } from '../../../types';

interface OverviewViewProps {
    session: AppSession;
    onNavigate: (path: string) => void;
}

/** Punto de entrada del dashboard: qué es este usuario y qué puede hacer hoy. */
export default function OverviewView({ session, onNavigate }: OverviewViewProps) {
    const { role, name, email } = session.user;
    const routes = getRoutesForRole(role);
    const permissions = getPermissions(role);

    return (
        <SpaceBetween size="l">
            <SectionCard title="Tu cuenta" description={getRoleDescription(role)}>
                <ColumnLayout columns={3} variant="text-grid">
                    <div>
                        <Box variant="awsui-key-label">Nombre</Box>
                        <Box>{name}</Box>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Correo</Box>
                        <Box>{email}</Box>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Rol</Box>
                        <Box>
                            <Badge color="blue">{getRoleLabel(role)}</Badge>
                        </Box>
                    </div>
                </ColumnLayout>
            </SectionCard>

            <SectionCard
                title="Secciones disponibles"
                description="Solo se listan las secciones habilitadas para tu rol."
            >
                <SpaceBetween size="s">
                    {routes.map((route) => (
                        <ColumnLayout key={route.id} columns={3} variant="text-grid">
                            <div>
                                {route.status === 'ready' ? (
                                    <Link
                                        href={route.path}
                                        onFollow={(event) => {
                                            event.preventDefault();
                                            onNavigate(route.path);
                                        }}
                                    >
                                        {route.label}
                                    </Link>
                                ) : (
                                    <Box>{route.label}</Box>
                                )}
                            </div>
                            <Box color="text-body-secondary">{route.description}</Box>
                            <div>
                                {route.status === 'ready' ? (
                                    <StatusIndicator type="success">Disponible</StatusIndicator>
                                ) : (
                                    <StatusIndicator type="pending">Planificada · sprint {route.sprint}</StatusIndicator>
                                )}
                            </div>
                        </ColumnLayout>
                    ))}
                </SpaceBetween>
            </SectionCard>

            <SectionCard
                title="Estado de la plataforma"
                description="Comprobaciones básicas del entorno en el que estás trabajando."
            >
                <SpaceBetween size="xs">
                    <StatusIndicator type={isSupabaseConfigured ? 'success' : 'warning'}>
                        {isSupabaseConfigured
                            ? 'Conexión con Supabase configurada'
                            : 'Supabase sin configurar: define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY'}
                    </StatusIndicator>
                    <Box color="text-body-secondary">
                        Permisos activos: {permissions.length > 0 ? permissions.join(', ') : 'solo consulta propia'}
                    </Box>
                </SpaceBetween>
            </SectionCard>
        </SpaceBetween>
    );
}
