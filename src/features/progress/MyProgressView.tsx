import { useMemo, useState } from 'react';

import Badge from '@cloudscape-design/components/badge';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import KeyValuePairs from '@cloudscape-design/components/key-value-pairs';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { DataTable, EmptyState, FeedbackAlert, LoadingState, SectionCard } from '../../components/ui';
import { useAsyncData } from '../../hooks/useAsyncData';
import { getErrorMessage } from '../../lib/errors';
import { downloadBlob } from '../../lib/pdf';
import {
    academicPeriodsService,
    computeAttendanceRate,
    computeAverageGrade,
    downloadReportFile,
    listAttendanceForStudent,
    listDisciplinaryRecordsForStudent,
    listGeneratedReportsForStudent,
    listGradesForStudent,
    studentsService,
    subjectsService,
} from '../../services';
import type { AppSession } from '../../types';
import { getSeverityLabel } from './SEVERITY_OPTIONS';

/**
 * Vista de solo lectura para estudiante y padre/acudiente.
 *
 * La lista de estudiantes ya llega acotada por RLS: un estudiante solo ve su
 * propio registro; un padre, el de sus hijos vinculados y activos. Por eso
 * `studentsService.list()` alcanza — no hace falta ninguna consulta especial
 * por rol.
 */
export default function MyProgressView({ session }: { session: AppSession }) {
    const { data: students, loading: loadingStudents, error: studentsError } = useAsyncData(
        () => studentsService.list(),
        [],
    );
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const studentList = students ?? [];
    const activeStudentId = selectedStudentId ?? studentList[0]?.id ?? null;
    const activeStudent = studentList.find((student) => student.id === activeStudentId) ?? null;

    const { data: subjects } = useAsyncData(() => subjectsService.list(), []);
    const { data: periods } = useAsyncData(() => academicPeriodsService.list(), []);
    const subjectById = useMemo(() => new Map((subjects ?? []).map((subject) => [subject.id, subject])), [subjects]);
    const periodById = useMemo(() => new Map((periods ?? []).map((period) => [period.id, period])), [periods]);

    const {
        data: grades,
        loading: loadingGrades,
        error: gradesError,
    } = useAsyncData(() => (activeStudentId ? listGradesForStudent(activeStudentId) : Promise.resolve([])), [activeStudentId]);

    const {
        data: attendance,
        loading: loadingAttendance,
        error: attendanceError,
    } = useAsyncData(
        () => (activeStudentId ? listAttendanceForStudent(activeStudentId) : Promise.resolve([])),
        [activeStudentId],
    );

    const {
        data: disciplineRecords,
        loading: loadingDiscipline,
        error: disciplineError,
    } = useAsyncData(
        () => (activeStudentId ? listDisciplinaryRecordsForStudent(activeStudentId) : Promise.resolve([])),
        [activeStudentId],
    );

    const {
        data: reports,
        loading: loadingReports,
        error: reportsError,
    } = useAsyncData(
        () => (activeStudentId ? listGeneratedReportsForStudent(activeStudentId) : Promise.resolve([])),
        [activeStudentId],
    );
    const boletines = useMemo(() => (reports ?? []).filter((report) => report.reportType === 'boletin'), [reports]);

    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const handleDownloadBoletin = async (fileUrl: string, id: string) => {
        setDownloadingId(id);
        setDownloadError(null);
        try {
            const blob = await downloadReportFile(fileUrl);
            downloadBlob(blob, `boletin-${activeStudent?.fullName.replace(/\s+/g, '_') ?? id}.pdf`);
        } catch (caught) {
            setDownloadError(getErrorMessage(caught));
        } finally {
            setDownloadingId(null);
        }
    };

    if (loadingStudents) {
        return <LoadingState text="Cargando tu información…" />;
    }

    if (studentList.length === 0) {
        return (
            <EmptyState
                title="Sin información académica todavía"
                description={
                    session.user.role === 'parent'
                        ? 'Cuando tengas un estudiante vinculado, su progreso aparecerá aquí.'
                        : 'Tu progreso académico aparecerá aquí cuando tengas calificaciones o asistencia registradas.'
                }
            />
        );
    }

    const average = computeAverageGrade(grades ?? []);
    const attendanceRate = computeAttendanceRate(attendance ?? []);

    return (
        <SpaceBetween size="l">
            <FeedbackAlert
                error={studentsError ?? gradesError ?? attendanceError ?? disciplineError ?? reportsError ?? downloadError}
            />

            {studentList.length > 1 ? (
                <Container header={<Header variant="h3">Estudiante</Header>}>
                    <Select
                        selectedOption={
                            activeStudent ? { label: activeStudent.fullName, value: activeStudent.id } : null
                        }
                        onChange={({ detail }) => setSelectedStudentId(detail.selectedOption.value ?? null)}
                        options={studentList.map((student) => ({ label: student.fullName, value: student.id }))}
                    />
                </Container>
            ) : null}

            <SectionCard
                title={studentList.length > 1 ? `Progreso de ${activeStudent?.fullName ?? ''}` : 'Tu progreso académico'}
                description={activeStudent?.gradeLevel ?? undefined}
            >
                <KeyValuePairs
                    columns={2}
                    items={[
                        {
                            label: 'Promedio de calificaciones',
                            value: <Box fontSize="display-l">{average !== null ? average.toFixed(2) : '—'}</Box>,
                        },
                        {
                            label: 'Porcentaje de asistencia',
                            value: <Box fontSize="display-l">{attendanceRate !== null ? `${attendanceRate}%` : '—'}</Box>,
                        },
                    ]}
                />
            </SectionCard>

            <DataTable
                title="Calificaciones"
                trackBy="id"
                items={grades ?? []}
                loading={loadingGrades}
                loadingText="Cargando calificaciones"
                emptyTitle="Sin calificaciones registradas"
                columns={[
                    {
                        id: 'subject',
                        header: 'Asignatura',
                        cell: (item) => subjectById.get(item.subjectId)?.name ?? item.subjectId,
                    },
                    {
                        id: 'period',
                        header: 'Periodo académico',
                        cell: (item) => periodById.get(item.academicPeriodId)?.name ?? item.academicPeriodId,
                    },
                    { id: 'value', header: 'Nota', cell: (item) => item.gradeValue.toFixed(2) },
                    { id: 'letter', header: 'Concepto', cell: (item) => item.gradeLetter ?? '—' },
                ]}
            />

            <DataTable
                title="Asistencia"
                trackBy="id"
                items={attendance ?? []}
                loading={loadingAttendance}
                loadingText="Cargando asistencia"
                emptyTitle="Sin registros de asistencia"
                columns={[
                    { id: 'date', header: 'Fecha', cell: (item) => item.attendanceDate },
                    {
                        id: 'status',
                        header: 'Estado',
                        cell: (item) => (
                            <Badge
                                color={item.status === 'present' ? 'green' : item.status === 'justified' ? 'blue' : 'red'}
                            >
                                {item.status === 'present' ? 'Presente' : item.status === 'justified' ? 'Justificado' : 'Ausente'}
                            </Badge>
                        ),
                    },
                ]}
            />

            <DataTable
                title="Historial disciplinario"
                trackBy="id"
                items={disciplineRecords ?? []}
                loading={loadingDiscipline}
                loadingText="Cargando historial disciplinario"
                emptyTitle="Sin incidencias registradas"
                columns={[
                    { id: 'date', header: 'Fecha', cell: (item) => item.recordDate },
                    {
                        id: 'severity',
                        header: 'Gravedad',
                        cell: (item) => (
                            <Badge color={item.severity === 'grave' ? 'red' : item.severity === 'moderada' ? 'blue' : 'grey'}>
                                {getSeverityLabel(item.severity)}
                            </Badge>
                        ),
                    },
                    { id: 'description', header: 'Descripción', cell: (item) => item.description },
                ]}
            />

            <DataTable
                title="Mis boletines"
                trackBy="id"
                items={boletines}
                loading={loadingReports}
                loadingText="Cargando boletines"
                emptyTitle="Sin boletines generados"
                emptyDescription="Cuando el colegio genere tu boletín, aparecerá aquí para descargar."
                columns={[
                    {
                        id: 'period',
                        header: 'Periodo académico',
                        cell: (item) => periodById.get(item.academicPeriodId ?? '')?.name ?? '—',
                    },
                    { id: 'date', header: 'Generado', cell: (item) => new Date(item.generatedAt).toLocaleDateString('es-CO') },
                    {
                        id: 'download',
                        header: 'Descargar',
                        cell: (item) => (
                            <Button
                                variant="inline-link"
                                loading={downloadingId === item.id}
                                onClick={() => void handleDownloadBoletin(item.fileUrl, item.id)}
                            >
                                Descargar
                            </Button>
                        ),
                    },
                ]}
            />
        </SpaceBetween>
    );
}
