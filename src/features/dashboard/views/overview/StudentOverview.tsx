import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { EmptyState, FeedbackAlert, SectionCard } from '../../../../components/ui';
import { useAsyncData } from '../../../../hooks/useAsyncData';
import {
    computeAttendanceRate,
    computeAverageGrade,
    listAttendanceForStudent,
    listGeneratedReportsForStudent,
    listGradesForStudent,
    schedulesService,
    studentsService,
} from '../../../../services';
import type { DayOfWeek } from '../../../../types';

interface StudentOverviewProps {
    onNavigate: (path: string) => void;
}

function todayDayOfWeek(): DayOfWeek {
    const jsDay = new Date().getDay();
    return (jsDay === 0 ? 7 : jsDay) as DayOfWeek;
}

/** Resumen para estudiantes: promedio, asistencia, próxima clase y último boletín. */
export default function StudentOverview({ onNavigate }: StudentOverviewProps) {
    const { data, loading, error } = useAsyncData(async () => {
        const students = await studentsService.list();
        const student = students[0] ?? null;
        if (!student) return { student: null };

        const [grades, attendance, reports, schedules] = await Promise.all([
            listGradesForStudent(student.id),
            listAttendanceForStudent(student.id),
            listGeneratedReportsForStudent(student.id),
            schedulesService.list(),
        ]);

        const nextClass = schedules
            .filter((schedule) => schedule.gradeLevel === student.gradeLevel && schedule.dayOfWeek === todayDayOfWeek())
            .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

        const latestBoletin = reports
            .filter((report) => report.reportType === 'boletin')
            .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];

        return {
            student,
            average: computeAverageGrade(grades),
            attendanceRate: computeAttendanceRate(attendance),
            nextClass,
            latestBoletin,
        };
    }, []);

    if (!loading && (!data || !data.student)) {
        return (
            <SectionCard title="Tu progreso" description="Resumen académico.">
                <EmptyState
                    title="Sin información académica todavía"
                    description="Tu progreso aparecerá aquí cuando tengas calificaciones o asistencia registradas."
                />
            </SectionCard>
        );
    }

    return (
        <SectionCard title="Tu progreso" description={data?.student?.gradeLevel ?? undefined}>
            <SpaceBetween size="l">
                <FeedbackAlert error={error} />

                <ColumnLayout columns={3} variant="text-grid">
                    <div>
                        <Box variant="awsui-key-label">Promedio de calificaciones</Box>
                        <Box fontSize="display-l">{loading ? '—' : data?.average !== null && data?.average !== undefined ? data.average.toFixed(2) : '—'}</Box>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Porcentaje de asistencia</Box>
                        <Box fontSize="display-l">{loading ? '—' : data?.attendanceRate !== null && data?.attendanceRate !== undefined ? `${data.attendanceRate}%` : '—'}</Box>
                    </div>
                    <div>
                        <Box variant="awsui-key-label">Próxima clase de hoy</Box>
                        <Box fontSize="heading-m">
                            {loading
                                ? '—'
                                : data?.nextClass
                                    ? `${data.nextClass.startTime.slice(0, 5)} – ${data.nextClass.endTime.slice(0, 5)}`
                                    : 'Sin clases hoy'}
                        </Box>
                    </div>
                </ColumnLayout>

                <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => onNavigate('/dashboard/progress')}>Ver mi progreso</Button>
                    <Button onClick={() => onNavigate('/dashboard/schedules')}>Ver horario completo</Button>
                    {data?.latestBoletin ? (
                        <Button onClick={() => onNavigate('/dashboard/progress')}>
                            Último boletín: {new Date(data.latestBoletin.generatedAt).toLocaleDateString('es-CO')}
                        </Button>
                    ) : null}
                </SpaceBetween>
            </SpaceBetween>
        </SectionCard>
    );
}
