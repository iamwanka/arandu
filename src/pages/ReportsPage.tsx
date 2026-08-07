import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import TextContent from '@cloudscape-design/components/text-content';

export default function ReportsPage() {
    return (
        <Container header={<Header variant="h2">Reportes</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Generación de reportes académicos</h3>
                    <p>
                        En este módulo se centralizarán las funciones de creación de reportes, exportación de datos y generación de PDFs para matrícula, calificaciones y asistencia.
                    </p>
                </TextContent>

                <Box>
                    <strong>Funcionalidades futuras:</strong>
                    <ul>
                        <li>Generación de boletines por estudiante.</li>
                        <li>Reportes por asignatura, grado y período.</li>
                        <li>Exportación de resultados a PDF y Excel.</li>
                    </ul>
                </Box>

                <StatusIndicator type="info">Diseño de módulo en progreso</StatusIndicator>
            </SpaceBetween>
        </Container>
    );
}
