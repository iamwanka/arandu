import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import KeyValuePairs from '@cloudscape-design/components/key-value-pairs';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { FeedbackAlert, SectionCard } from '../../../../components/ui';
import { useAsyncData } from '../../../../hooks/useAsyncData';
import { enrollmentsService, fetchActiveAcademicPeriod, studentsService, teachersService } from '../../../../services';

interface AdminOverviewProps {
    onNavigate: (path: string) => void;
}

/** Resumen para admin/coordinador: cifras del periodo vigente y accesos directos a las tareas más comunes. */
export default function AdminOverview({ onNavigate }: AdminOverviewProps) {
    const { data, loading, error } = useAsyncData(async () => {
        const [students, teachers, enrollments, activePeriod] = await Promise.all([
            studentsService.list(),
            teachersService.list(),
            enrollmentsService.list(),
            fetchActiveAcademicPeriod(),
        ]);

        const periodEnrollments = activePeriod
            ? enrollments.filter((enrollment) => enrollment.academicPeriodId === activePeriod.id)
            : [];

        return {
            studentsCount: students.length,
            activeTeachersCount: teachers.filter((teacher) => teacher.active).length,
            activePeriodName: activePeriod?.name ?? null,
            activeEnrollments: periodEnrollments.filter((enrollment) => enrollment.status === 'active').length,
            pendingEnrollments: periodEnrollments.filter((enrollment) => enrollment.status === 'inactive').length,
        };
    }, []);

    return (
        <SectionCard
            title="Panorama institucional"
            description={data?.activePeriodName ? `Periodo vigente: ${data.activePeriodName}` : 'Sin periodo académico activo.'}
        >
            <SpaceBetween size="l">
                <FeedbackAlert error={error} />

                <KeyValuePairs
                    columns={4}
                    items={[
                        {
                            label: 'Estudiantes registrados',
                            value: <Box fontSize="display-l">{loading ? '—' : data?.studentsCount}</Box>,
                        },
                        {
                            label: 'Docentes activos',
                            value: <Box fontSize="display-l">{loading ? '—' : data?.activeTeachersCount}</Box>,
                        },
                        {
                            label: 'Matrículas activas',
                            value: <Box fontSize="display-l">{loading ? '—' : data?.activeEnrollments}</Box>,
                        },
                        {
                            label: 'Matrículas pendientes',
                            value: <Box fontSize="display-l">{loading ? '—' : data?.pendingEnrollments}</Box>,
                        },
                    ]}
                />

                <SpaceBetween direction="horizontal" size="xs">
                    <Button iconName="add-plus" onClick={() => onNavigate('/dashboard/students')}>
                        Nuevo estudiante
                    </Button>
                    <Button iconName="add-plus" onClick={() => onNavigate('/dashboard/academic')}>
                        Nueva matrícula
                    </Button>
                    <Button onClick={() => onNavigate('/dashboard/reports')}>Generar reportes</Button>
                </SpaceBetween>
            </SpaceBetween>
        </SectionCard>
    );
}
