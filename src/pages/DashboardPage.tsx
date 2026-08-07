import { useMemo, useState } from 'react';

import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Checkbox from '@cloudscape-design/components/checkbox';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import TextContent from '@cloudscape-design/components/text-content';

import type { AppRoute } from '../routes';
import type { AppRole, AppSession } from '../types';
import { getRoleLabel } from '../lib/roles';

interface DashboardPageProps {
    session: AppSession;
    routes: AppRoute[];
}

const DASHBOARD_WIDGETS = [
    {
        id: 'overview',
        title: 'Resumen del sistema',
        description: 'Estado general de usuarios, tareas y accesos recientes.',
        content: (
            <Box>
                <p>Usuarios activos: <strong>24</strong></p>
                <p>Módulos habilitados: <strong>5</strong></p>
                <p>Indicadores RLS activos: <strong>3</strong></p>
            </Box>
        ),
    },
    {
        id: 'tasks',
        title: 'Mis tareas',
        description: 'Accesos directos a tareas pendientes y revisiones del día.',
        content: (
            <Box>
                <p>Revisar matrículas pendientes</p>
                <p>Actualizar perfil de docentes</p>
                <p>Preparar reporte semanal</p>
            </Box>
        ),
    },
    {
        id: 'activity',
        title: 'Actividad reciente',
        description: 'Eventos recientes y cambios importantes del sistema.',
        content: (
            <Box>
                <p>Nuevo registro de estudiante aprobado</p>
                <p>Rol actualizado para usuario admin</p>
                <p>Política RLS revisada en el módulo Académico</p>
            </Box>
        ),
    },
    {
        id: 'reports',
        title: 'Reportes rápidos',
        description: 'Accede a los reportes académicos y comprobantes más usados.',
        content: (
            <Box>
                <p>Reporte de asistencia</p>
                <p>Reporte de calificaciones</p>
                <p>Exportar plan de clases</p>
            </Box>
        ),
    },
    {
        id: 'roles',
        title: 'Estado de roles',
        description: 'Resumen de permisos y roles asignados en el sistema.',
        content: (
            <Box>
                <p>Administradores: <strong>2</strong></p>
                <p>Coordinadores: <strong>1</strong></p>
                <p>Docentes activos: <strong>8</strong></p>
            </Box>
        ),
        roles: ['admin', 'coordinator'] as AppRole[],
    },
];

const DASHBOARD_CONFIG_KEY = 'arandu-dashboard-config';

function loadDashboardConfig(defaultWidgets: string[]) {
    try {
        const raw = window.localStorage.getItem(DASHBOARD_CONFIG_KEY);
        if (!raw) return defaultWidgets;
        const parsed = JSON.parse(raw) as string[];
        if (!Array.isArray(parsed)) return defaultWidgets;
        return parsed;
    } catch {
        return defaultWidgets;
    }
}

function saveDashboardConfig(widgetIds: string[]) {
    try {
        window.localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(widgetIds));
    } catch {
        // Ignore localStorage failures
    }
}

export default function DashboardPage({ session, routes }: DashboardPageProps) {
    const defaultWidgetIds = useMemo(
        () => DASHBOARD_WIDGETS.filter((widget) => !widget.roles || widget.roles.includes(session.user.role)).map((widget) => widget.id),
        [session.user.role],
    );

    const [visibleWidgets, setVisibleWidgets] = useState<string[]>(() => loadDashboardConfig(defaultWidgetIds));
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const availableWidgets = useMemo(
        () => DASHBOARD_WIDGETS.filter((widget) => !widget.roles || widget.roles.includes(session.user.role)),
        [session.user.role],
    );

    const widgetsToRender = availableWidgets.filter((widget) => visibleWidgets.includes(widget.id));

    const toggleWidgetVisibility = (widgetId: string) => {
        setVisibleWidgets((current) => {
            const next = current.includes(widgetId)
                ? current.filter((id) => id !== widgetId)
                : [...current, widgetId];
            saveDashboardConfig(next);
            return next;
        });
    };

    return (
        <Container header={<Header variant="h2">Panel configurable</Header>}>
            <SpaceBetween size="l">
                <SpaceBetween size="m">
                    <TextContent>
                        <h3>Hola, {session.user.name}</h3>
                        <p>
                            Construye tu panel de control eligiendo los bloques que quieres ver. Puedes guardar tu configuración para usarla en tu próxima sesión.
                        </p>
                    </TextContent>

                    <Box>
                        <Button onClick={() => setIsConfigModalOpen(true)} variant="primary">
                            Configurar panel
                        </Button>
                    </Box>
                </SpaceBetween>

                <Box>
                    <strong>Rol actual:</strong> {getRoleLabel(session.user.role)} · {routes.length} módulos habilitados
                </Box>

                <ColumnLayout columns={2} variant="text-grid">
                    {widgetsToRender.length > 0 ? (
                        widgetsToRender.map((widget) => (
                            <Box key={widget.id} padding="l" className="route-card">
                                <TextContent>
                                    <h4>{widget.title}</h4>
                                    <p>{widget.description}</p>
                                </TextContent>
                                {widget.content}
                            </Box>
                        ))
                    ) : (
                        <Box padding="l" className="route-card">
                            <TextContent>
                                <h4>Sin widgets seleccionados</h4>
                                <p>Abre la configuración para activar los bloques que deseas ver en tu tablero.</p>
                            </TextContent>
                        </Box>
                    )}
                </ColumnLayout>
            </SpaceBetween>

            <Modal
                visible={isConfigModalOpen}
                onDismiss={() => setIsConfigModalOpen(false)}
                header="Configurar dashboard"
                footer={
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button onClick={() => setIsConfigModalOpen(false)}>Cerrar</Button>
                        <Button onClick={() => setIsConfigModalOpen(false)} variant="primary">
                            Listo
                        </Button>
                    </SpaceBetween>
                }
            >
                <SpaceBetween size="m">
                    <TextContent>
                        <h3>Selecciona los bloques que deseas ver</h3>
                        <p>Tu elección se guarda automáticamente en este navegador.</p>
                    </TextContent>

                    {availableWidgets.map((widget) => (
                        <Checkbox
                            key={widget.id}
                            checked={visibleWidgets.includes(widget.id)}
                            onChange={() => toggleWidgetVisibility(widget.id)}
                        >
                            {widget.title}
                        </Checkbox>
                    ))}
                </SpaceBetween>
            </Modal>
        </Container>
    );
}
