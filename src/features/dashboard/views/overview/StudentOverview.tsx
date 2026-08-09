import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import KeyValuePairs from '@cloudscape-design/components/key-value-pairs';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { DataTable, EmptyState, FeedbackAlert, SectionCard } from '../../../../components/ui';
import { useAsyncData } from '../../../../hooks/useAsyncData';
import {
    computeAttendanceRate,
    computeAverageGrade,
    fetchActiveAcademicPeriod,
    listAttendanceForStudent,
    listDisciplinaryRecordsForStudent,
    listGeneratedReportsForStudent,
    listGradesForStudent,
    schedulesService,
    studentsService,
    subjectsService,
} from '../../../../services';
import type { DayOfWeek } from '../../../../types';
import ActivityFeed from './ActivityFeed';
import { attendanceStatus, buildActivityItems, gradeStatus } from './indicators';

interface StudentOverviewProps {
    onNavigate: (path: string) => void;
}

interface SubjectGradeRow {
    id: string;
    subjectName: string;
    gradeValue: number;
}

function todayDayOfWeek(): DayOfWeek {
    const jsDay = new Date().getDay();
    return (jsDay === 0 ? 7 : jsDay) as DayOfWeek;
}

/** Resumen para estudiantes: desempeño del periodo vigente por asignatura y actividad reciente, no solo un promedio suelto. */
export default function StudentOverview({ onNavigate }: StudentOverviewProps) {
    const { data, loading, error } = useAsyncData(async () => {
        const students = await studentsService.list();
        const student = students[0] ?? null;
        if (!student) return { student: null };

        const [allGrades, allAttendance, discipline, reports, schedules, subjects, activePeriod] = await Promise.all([
            listGradesForStudent(student.id),
            listAttendanceForStudent(student.id),
            listDisciplinaryRecordsForStudent(student.id),
            listGeneratedReportsForStudent(student.id),
            schedulesService.list(),
            subjectsService.list(),
            fetchActiveAcademicPeriod(),
        ]);

        const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

        const periodGrades = activePeriod ? allGrades.filter((grade) => grade.academicPeriodId === activePeriod.id) : allGrades;
        const periodAttendance = activePeriod
            ? allAttendance.filter(
                  (record) => record.attendanceDate >= activePeriod.startDate && record.attendanceDate <= activePeriod.endDate,
              )
            : allAttendance;

        const subjectRows: SubjectGradeRow[] = periodGrades
            .map((grade) => ({
                id: grade.id,
                subjectName: subjectById.get(grade.subjectId)?.name ?? 'Asignatura',
                gradeValue: grade.gradeValue,
            }))
            .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

        const nextClass = schedules
            .filter((schedule) => schedule.gradeLevel === student.gradeLevel && schedule.dayOfWeek === todayDayOfWeek())
            .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

        const latestBoletin = reports
            .filter((report) => report.reportType === 'boletin')
            .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];

        const activity = buildActivityItems(allGrades, allAttendance, discipline, subjectById).slice(0, 6);

        return {
            student,
            activePeriod,
            average: computeAverageGrade(periodGrades),
            attendanceRate: computeAttendanceRate(periodAttendance),
            subjectRows,
            nextClass,
            latestBoletin,
            activity,
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

    const average = data?.average ?? null;
    const attendanceRate = data?.attendanceRate ?? null;

    return (
        <SpaceBetween size="l">
            <SectionCard
                title="Tu progreso"
                description={data?.activePeriod ? `Periodo vigente: ${data.activePeriod.name}` : data?.student?.gradeLevel ?? undefined}
            >
                <SpaceBetween size="l">
                    <FeedbackAlert error={error} />

                    <KeyValuePairs
                        columns={3}
                        items={[
                            {
                                label: 'Promedio del periodo',
                                value: (
                                    <>
                                        <Box fontSize="display-l" fontWeight="bold">
                                            {loading ? '—' : average !== null ? average.toFixed(2) : '—'}
                                        </Box>
                                        {!loading && average !== null ? (
                                            <StatusIndicator type={gradeStatus(average).type}>
                                                {gradeStatus(average).label}
                                            </StatusIndicator>
                                        ) : !loading ? (
                                            <Box color="text-body-secondary">Sin notas este periodo</Box>
                                        ) : null}
                                    </>
                                ),
                            },
                            {
                                label: 'Asistencia del periodo',
                                value: (
                                    <>
                                        <Box fontSize="display-l" fontWeight="bold">
                                            {loading ? '—' : attendanceRate !== null ? `${attendanceRate}%` : '—'}
                                        </Box>
                                        {!loading && attendanceRate !== null ? (
                                            <StatusIndicator type={attendanceStatus(attendanceRate).type}>
                                                {attendanceStatus(attendanceRate).label}
                                            </StatusIndicator>
                                        ) : !loading ? (
                                            <Box color="text-body-secondary">Sin asistencia este periodo</Box>
                                        ) : null}
                                    </>
                                ),
                            },
                            {
                                label: 'Próxima clase de hoy',
                                value: (
                                    <Box fontSize="heading-m">
                                        {loading
                                            ? '—'
                                            : data?.nextClass
                                              ? `${data.nextClass.startTime.slice(0, 5)} – ${data.nextClass.endTime.slice(0, 5)}`
                                              : 'Sin clases hoy'}
                                    </Box>
                                ),
                            },
                        ]}
                    />

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

            <SectionCard title="Tus asignaturas este periodo" description="Una fila por asignatura con nota registrada.">
                <DataTable
                    title="Notas por asignatura"
                    trackBy="id"
                    items={data?.subjectRows ?? []}
                    loading={loading}
                    loadingText="Cargando asignaturas"
                    emptyTitle="Sin calificaciones este periodo"
                    emptyDescription="Cuando un docente registre tus notas del periodo vigente, aparecerán aquí."
                    columns={[
                        { id: 'subject', header: 'Asignatura', cell: (item) => item.subjectName },
                        { id: 'grade', header: 'Nota', cell: (item) => item.gradeValue.toFixed(1) },
                        {
                            id: 'status',
                            header: '',
                            cell: (item) => (
                                <StatusIndicator type={gradeStatus(item.gradeValue).type}>
                                    {gradeStatus(item.gradeValue).label}
                                </StatusIndicator>
                            ),
                        },
                    ]}
                />
            </SectionCard>

            <SectionCard title="Actividad reciente" description="Tus últimos registros de notas, asistencia y disciplina.">
                <ActivityFeed
                    items={data?.activity ?? []}
                    emptyDescription="Cuando se registre una nota, asistencia o incidencia, aparecerá aquí."
                />
            </SectionCard>
        </SpaceBetween>
    );
}
