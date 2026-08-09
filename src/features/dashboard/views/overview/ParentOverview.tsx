import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';

import { DataTable, FeedbackAlert, SectionCard } from '../../../../components/ui';
import { useAsyncData } from '../../../../hooks/useAsyncData';
import {
    computeAttendanceRate,
    computeAverageGrade,
    fetchActiveAcademicPeriod,
    listAttendanceForStudent,
    listDisciplinaryRecordsForStudent,
    listGradesForStudent,
    studentsService,
    subjectsService,
} from '../../../../services';
import type { Student } from '../../../../types';
import ActivityFeed from './ActivityFeed';
import { attendanceStatus, buildActivityItems, gradeStatus, type ActivityItem } from './indicators';

interface ParentOverviewProps {
    onNavigate: (path: string) => void;
}

interface ChildSummary {
    id: string;
    student: Student;
    average: number | null;
    attendanceRate: number | null;
    activity: ActivityItem[];
}

/** Resumen para padres/acudientes: promedio y asistencia del periodo vigente por hijo, más una línea de tiempo combinada. */
export default function ParentOverview({ onNavigate }: ParentOverviewProps) {
    const { data, loading, error } = useAsyncData(async () => {
        const [students, subjects, activePeriod] = await Promise.all([
            studentsService.list(),
            subjectsService.list(),
            fetchActiveAcademicPeriod(),
        ]);

        const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

        const children: ChildSummary[] = await Promise.all(
            students.map(async (student) => {
                const [grades, attendance, discipline] = await Promise.all([
                    listGradesForStudent(student.id),
                    listAttendanceForStudent(student.id),
                    listDisciplinaryRecordsForStudent(student.id),
                ]);

                const periodGrades = activePeriod ? grades.filter((grade) => grade.academicPeriodId === activePeriod.id) : grades;
                const periodAttendance = activePeriod
                    ? attendance.filter(
                          (record) => record.attendanceDate >= activePeriod.startDate && record.attendanceDate <= activePeriod.endDate,
                      )
                    : attendance;

                return {
                    id: student.id,
                    student,
                    average: computeAverageGrade(periodGrades),
                    attendanceRate: computeAttendanceRate(periodAttendance),
                    activity: buildActivityItems(grades, attendance, discipline, subjectById, student.fullName.split(' ')[0]),
                };
            }),
        );

        const combinedActivity = children
            .flatMap((child) => child.activity)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 8);

        return { children, combinedActivity, activePeriod };
    }, []);

    return (
        <SpaceBetween size="l">
            <FeedbackAlert error={error} />

            <SectionCard
                title="Tus hijos vinculados"
                description={data?.activePeriod ? `Periodo vigente: ${data.activePeriod.name}` : undefined}
            >
                <DataTable
                    title="Resumen por estudiante"
                    trackBy="id"
                    items={data?.children ?? []}
                    loading={loading}
                    loadingText="Cargando resumen"
                    emptyTitle="Sin estudiantes vinculados"
                    emptyDescription="Cuando tengas un estudiante vinculado a tu cuenta, su resumen aparecerá aquí."
                    columns={[
                        { id: 'name', header: 'Estudiante', cell: (item) => item.student.fullName },
                        { id: 'grade', header: 'Grado', cell: (item) => item.student.gradeLevel ?? '—' },
                        {
                            id: 'average',
                            header: 'Promedio',
                            cell: (item) =>
                                item.average !== null ? (
                                    <StatusIndicator type={gradeStatus(item.average).type}>{item.average.toFixed(2)}</StatusIndicator>
                                ) : (
                                    '—'
                                ),
                        },
                        {
                            id: 'attendance',
                            header: 'Asistencia',
                            cell: (item) =>
                                item.attendanceRate !== null ? (
                                    <StatusIndicator type={attendanceStatus(item.attendanceRate).type}>
                                        {item.attendanceRate}%
                                    </StatusIndicator>
                                ) : (
                                    '—'
                                ),
                        },
                        {
                            id: 'action',
                            header: '',
                            cell: (item) => (
                                <Button variant="inline-link" onClick={() => onNavigate('/dashboard/progress')}>
                                    Ver progreso de {item.student.fullName.split(' ')[0]}
                                </Button>
                            ),
                        },
                    ]}
                />
            </SectionCard>

            <SectionCard title="Actividad reciente" description="Últimos registros de notas, asistencia y disciplina de tus hijos.">
                <ActivityFeed
                    items={data?.combinedActivity ?? []}
                    emptyDescription="Cuando se registre una nota, asistencia o incidencia de un hijo vinculado, aparecerá aquí."
                />
            </SectionCard>
        </SpaceBetween>
    );
}
