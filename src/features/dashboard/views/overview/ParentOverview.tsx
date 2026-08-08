import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { DataTable, FeedbackAlert } from '../../../../components/ui';
import { useAsyncData } from '../../../../hooks/useAsyncData';
import {
    computeAttendanceRate,
    computeAverageGrade,
    listAttendanceForStudent,
    listGradesForStudent,
    studentsService,
} from '../../../../services';
import type { Student } from '../../../../types';

interface ParentOverviewProps {
    onNavigate: (path: string) => void;
}

interface ChildSummary {
    id: string;
    student: Student;
    average: number | null;
    attendanceRate: number | null;
}

/** Resumen para padres/acudientes: promedio y asistencia de cada hijo vinculado. */
export default function ParentOverview({ onNavigate }: ParentOverviewProps) {
    const { data: children, loading, error } = useAsyncData(async (): Promise<ChildSummary[]> => {
        const students = await studentsService.list();

        return Promise.all(
            students.map(async (student) => {
                const [grades, attendance] = await Promise.all([
                    listGradesForStudent(student.id),
                    listAttendanceForStudent(student.id),
                ]);

                return {
                    id: student.id,
                    student,
                    average: computeAverageGrade(grades),
                    attendanceRate: computeAttendanceRate(attendance),
                };
            }),
        );
    }, []);

    return (
        <SpaceBetween size="l">
            <FeedbackAlert error={error} />

            <DataTable
                title="Tus hijos vinculados"
                description="Promedio y asistencia de cada estudiante a tu cargo."
                trackBy="id"
                items={children ?? []}
                loading={loading}
                loadingText="Cargando resumen"
                emptyTitle="Sin estudiantes vinculados"
                emptyDescription="Cuando tengas un estudiante vinculado a tu cuenta, su resumen aparecerá aquí."
                columns={[
                    { id: 'name', header: 'Estudiante', cell: (item) => item.student.fullName },
                    { id: 'grade', header: 'Grado', cell: (item) => item.student.gradeLevel ?? '—' },
                    { id: 'average', header: 'Promedio', cell: (item) => (item.average !== null ? item.average.toFixed(2) : '—') },
                    { id: 'attendance', header: 'Asistencia', cell: (item) => (item.attendanceRate !== null ? `${item.attendanceRate}%` : '—') },
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
        </SpaceBetween>
    );
}
