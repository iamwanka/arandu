import { useMemo, useState } from 'react';

import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import DatePicker from '@cloudscape-design/components/date-picker';
import FormField from '@cloudscape-design/components/form-field';
import SegmentedControl from '@cloudscape-design/components/segmented-control';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { DataTable, EmptyState, FeedbackAlert } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncData } from '../../hooks/useAsyncData';
import { enrollmentsService, listAttendanceForDate, studentsService, upsertAttendance } from '../../services';
import type { AppSession, AttendanceInput, AttendanceStatus } from '../../types';
import AcademicPeriodSelect from '../academic/AcademicPeriodSelect';

const STATUS_LABEL: Record<AttendanceStatus, string> = {
    present: 'Presente',
    absent: 'Ausente',
    justified: 'Justificado',
};

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

interface AttendanceEntryPanelProps {
    session: AppSession;
}

/** Registro de asistencia diaria: docente/coordinador/admin eligen periodo y fecha, y marcan la asistencia del curso. */
export default function AttendanceEntryPanel({ session }: AttendanceEntryPanelProps) {
    const [periodId, setPeriodId] = useState<string | null>(null);
    const [date, setDate] = useState(todayIso());
    const [statusByStudent, setStatusByStudent] = useState<Record<string, AttendanceStatus>>({});

    const { data: roster, loading: loadingRoster, error: rosterError } = useAsyncData(async () => {
        if (!periodId || !date) return null;

        const [enrollments, students, existing] = await Promise.all([
            enrollmentsService.list(),
            studentsService.list(),
            listAttendanceForDate(date),
        ]);

        const studentById = new Map(students.map((student) => [student.id, student]));
        const enrolled = enrollments.filter(
            (enrollment) => enrollment.academicPeriodId === periodId && enrollment.status === 'active',
        );

        const existingByStudent = new Map(existing.map((record) => [record.studentId, record]));

        const nextStatus: Record<string, AttendanceStatus> = {};
        for (const enrollment of enrolled) {
            nextStatus[enrollment.studentId] = existingByStudent.get(enrollment.studentId)?.status ?? 'present';
        }
        setStatusByStudent(nextStatus);

        return enrolled
            .map((enrollment) => studentById.get(enrollment.studentId))
            .filter((student): student is NonNullable<typeof student> => Boolean(student))
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [periodId, date]);

    const summary = useMemo(() => {
        const values = Object.values(statusByStudent);
        return {
            present: values.filter((status) => status === 'present').length,
            absent: values.filter((status) => status === 'absent').length,
            justified: values.filter((status) => status === 'justified').length,
        };
    }, [statusByStudent]);

    const save = useAsyncAction(
        async () => {
            const inputs: AttendanceInput[] = Object.entries(statusByStudent).map(([studentId, status]) => ({
                studentId,
                attendanceDate: date,
                status,
                recordedBy: session.user.id,
            }));

            return upsertAttendance(inputs);
        },
        { successMessage: (saved) => `Asistencia guardada para ${saved.length} estudiantes.` },
    );

    return (
        <SpaceBetween size="l">
            <ColumnLayout columns={2}>
                <FormField label="Periodo académico">
                    <AcademicPeriodSelect value={periodId} onChange={(id) => setPeriodId(id)} />
                </FormField>
                <FormField label="Fecha">
                    <DatePicker value={date} onChange={(event) => setDate(event.detail.value)} placeholder="AAAA/MM/DD" />
                </FormField>
            </ColumnLayout>

            {!periodId || !date ? (
                <EmptyState
                    title="Elige periodo y fecha"
                    description="La planilla de asistencia aparece aquí una vez elegidos ambos."
                />
            ) : (
                <SpaceBetween size="m">
                    <FeedbackAlert error={rosterError ?? save.error} success={save.success} />

                    <DataTable
                        title={`Asistencia — ${date}`}
                        description={`Presentes: ${summary.present} · Ausentes: ${summary.absent} · Justificados: ${summary.justified}`}
                        trackBy="id"
                        items={roster ?? []}
                        loading={loadingRoster}
                        loadingText="Cargando estudiantes matriculados"
                        emptyTitle="Sin estudiantes matriculados"
                        emptyDescription="No hay matrículas activas para este periodo."
                        actions={
                            <Button
                                variant="primary"
                                loading={save.pending}
                                disabled={Object.keys(statusByStudent).length === 0}
                                onClick={() => void save.run()}
                            >
                                Guardar asistencia
                            </Button>
                        }
                        columns={[
                            { id: 'fullName', header: 'Estudiante', cell: (item) => item.fullName },
                            { id: 'gradeLevel', header: 'Grado', cell: (item) => item.gradeLevel ?? '—' },
                            {
                                id: 'status',
                                header: 'Estado',
                                cell: (item) => (
                                    <SegmentedControl
                                        selectedId={statusByStudent[item.id] ?? 'present'}
                                        onChange={({ detail }) =>
                                            setStatusByStudent((current) => ({
                                                ...current,
                                                [item.id]: detail.selectedId as AttendanceStatus,
                                            }))
                                        }
                                        options={(Object.keys(STATUS_LABEL) as AttendanceStatus[]).map((status) => ({
                                            id: status,
                                            text: STATUS_LABEL[status],
                                        }))}
                                    />
                                ),
                            },
                        ]}
                    />
                </SpaceBetween>
            )}
        </SpaceBetween>
    );
}
