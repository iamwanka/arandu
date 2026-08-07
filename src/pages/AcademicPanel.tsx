import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import TextContent from '@cloudscape-design/components/text-content';

import { generateEnrollmentReceiptPdf } from '../lib/pdf';
import type { AppSession } from '../types';

interface AcademicPanelProps {
    session: AppSession;
}

export default function AcademicPanel({ session }: AcademicPanelProps) {
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
        <Container header={<Header variant="h2">Módulo académico</Header>}>
            <SpaceBetween size="l">
                <TextContent>
                    <h3>Módulos de Sprint 2</h3>
                    <p>
                        Esta vista agrupa la lógica de estudiantes, docentes, asignaturas y matrícula. Cada uno de estos componentes se desarrollará como un módulo independiente y conectado a Supabase.
                    </p>
                </TextContent>

                <ColumnLayout columns={2} variant="text-grid">
                    <Box>
                        <strong>Estudiantes</strong>
                        <p>Panel para CRUD de alumnos y su información académica.</p>
                        <StatusIndicator type="info">En desarrollo</StatusIndicator>
                    </Box>
                    <Box>
                        <strong>Docentes</strong>
                        <p>Panel para gestionar perfiles, asignaciones y horarios.</p>
                        <StatusIndicator type="info">En desarrollo</StatusIndicator>
                    </Box>
                    <Box>
                        <strong>Asignaturas</strong>
                        <p>Catálogo de materias con vínculo a los docentes.</p>
                        <StatusIndicator type="info">En desarrollo</StatusIndicator>
                    </Box>
                    <Box>
                        <strong>Matrícula</strong>
                        <p>Proceso de inscripción con comprobante.</p>
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
