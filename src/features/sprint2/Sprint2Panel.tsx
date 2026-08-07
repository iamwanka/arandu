import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import TextContent from '@cloudscape-design/components/text-content';

import { generateEnrollmentReceiptPdf } from '../../lib/pdf';
import type { AppSession } from '../../types';

interface Sprint2PanelProps {
    session: AppSession;
}

export default function Sprint2Panel({ session }: Sprint2PanelProps) {
    const handleGeneratePdf = () => {
        generateEnrollmentReceiptPdf({
            studentName: session.user.name,
            studentEmail: session.user.email,
            gradeLevel: '10° Básico',
            programName: 'Educación Integral Arandu',
            advisorName: 'Departamento de Admisiones',
            enrollmentDate: new Date().toLocaleDateString('es-PE'),
        });
    };

    return (
        <Container header={<Header variant="h2">Sprint 2 · Conexión a módulos académicos</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Próximo paso: CRUD académico</h3>
                    <p>
                        Esta vista sirve como puerta de enlace entre el panel de roles de Sprint 1 y el CRUD de
                        estudiantes, docentes y asignaturas de Sprint 2.
                    </p>
                </TextContent>

                <ColumnLayout columns={2} variant="text-grid">
                    <Box>
                        <strong>Estudiantes</strong>
                        <p>CRUD de datos de alumnos, matrícula y estados académicos.</p>
                        <StatusIndicator type="info">En desarrollo</StatusIndicator>
                    </Box>
                    <Box>
                        <strong>Docentes</strong>
                        <p>CRUD para perfiles de docentes, asignación de materias y horarios.</p>
                        <StatusIndicator type="info">En desarrollo</StatusIndicator>
                    </Box>
                    <Box>
                        <strong>Asignaturas</strong>
                        <p>CRUD para el catálogo de materias y su vínculo con docentes.</p>
                        <StatusIndicator type="info">En desarrollo</StatusIndicator>
                    </Box>
                    <Box>
                        <strong>Matrícula</strong>
                        <p>Proceso de matrícula con comprobante PDF listo para generar.</p>
                        <StatusIndicator type="success">Disponible</StatusIndicator>
                    </Box>
                </ColumnLayout>

                <Box>
                    <SpaceBetween size="m">
                        <div>
                            <strong>Usuario actual:</strong> {session.user.email}
                        </div>
                        <div>
                            <strong>Rol:</strong> {session.user.role}
                        </div>
                    </SpaceBetween>
                </Box>

                <Button variant="primary" onClick={handleGeneratePdf} iconName="download">
                    Generar comprobante de matrícula PDF
                </Button>
            </SpaceBetween>
        </Container>
    );
}
