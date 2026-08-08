import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { SectionCard } from '../../../components/ui';
import type { AppRoute } from '../../../routes/appRoutes';

interface PlannedModuleViewProps {
    route: AppRoute;
}

/**
 * Vista para las secciones ya declaradas en el registro de rutas pero cuya
 * implementación corresponde a un sprint posterior. Mostrar el sprint previsto
 * es preferible a ocultar la sección o a rellenarla con datos ficticios.
 */
export default function PlannedModuleView({ route }: PlannedModuleViewProps) {
    return (
        <SectionCard title={route.label} description={route.description}>
            <SpaceBetween size="m">
                <Alert type="info" header={`Módulo planificado para el sprint ${route.sprint}`}>
                    La navegación, los permisos y el modelo de datos de esta sección ya están definidos. Falta
                    construir la interfaz y conectarla con los servicios.
                </Alert>
                <Box color="text-body-secondary">
                    El detalle del alcance está en <em>docs/plan-implementacion-sprints.md</em>.
                </Box>
            </SpaceBetween>
        </SectionCard>
    );
}
