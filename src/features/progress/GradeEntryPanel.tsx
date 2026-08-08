import { useMemo, useState } from 'react';

import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';

import { DataTable, EmptyState, FeedbackAlert } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncData } from '../../hooks/useAsyncData';
import { enrollmentsService, listGradesForSubjectPeriod, studentsService, subjectsService, upsertGrades } from '../../services';
import type { AppSession, GradeInput } from '../../types';
import AcademicPeriodSelect from '../academic/AcademicPeriodSelect';
import SubjectSelect from '../academic/SubjectSelect';

interface RowState {
    value: string;
    letter: string;
}

function isValidGradeValue(value: string): boolean {
    if (!value.trim()) return true; // vacío = sin nota, no bloquea el guardado de las demás filas
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10;
}

interface GradeEntryPanelProps {
    session: AppSession;
}

/** Planilla de calificaciones: docente/coordinador/admin eligen asignatura y periodo, y capturan notas por lote. */
export default function GradeEntryPanel({ session }: GradeEntryPanelProps) {
    const [subjectId, setSubjectId] = useState<string | null>(null);
    const [periodId, setPeriodId] = useState<string | null>(null);
    const [rows, setRows] = useState<Record<string, RowState>>({});

    const { data: subjects } = useAsyncData(() => subjectsService.list(), []);
    const subject = (subjects ?? []).find((candidate) => candidate.id === subjectId) ?? null;

    const { data: roster, loading: loadingRoster, error: rosterError } = useAsyncData(async () => {
        if (!subjectId || !periodId || !subject) return null;

        const [enrollments, students, existingGrades] = await Promise.all([
            enrollmentsService.list(),
            studentsService.list(),
            listGradesForSubjectPeriod(subjectId, periodId),
        ]);

        const studentById = new Map(students.map((student) => [student.id, student]));
        const enrolled = enrollments.filter(
            (enrollment) =>
                enrollment.academicPeriodId === periodId &&
                enrollment.status === 'active' &&
                (!subject.gradeLevel || enrollment.gradeLevel === subject.gradeLevel),
        );

        const gradeByStudent = new Map(existingGrades.map((grade) => [grade.studentId, grade]));

        const nextRows: Record<string, RowState> = {};
        for (const enrollment of enrolled) {
            const existing = gradeByStudent.get(enrollment.studentId);
            nextRows[enrollment.studentId] = {
                value: existing ? String(existing.gradeValue) : '',
                letter: existing?.gradeLetter ?? '',
            };
        }
        setRows(nextRows);

        return enrolled
            .map((enrollment) => studentById.get(enrollment.studentId))
            .filter((student): student is NonNullable<typeof student> => Boolean(student))
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [subjectId, periodId]);

    const invalidCount = useMemo(
        () => Object.values(rows).filter((row) => !isValidGradeValue(row.value)).length,
        [rows],
    );

    const save = useAsyncAction(
        async () => {
            const inputs: GradeInput[] = Object.entries(rows)
                .filter(([, row]) => row.value.trim())
                .map(([studentId, row]) => ({
                    studentId,
                    subjectId: subjectId!,
                    academicPeriodId: periodId!,
                    gradeValue: Number(row.value),
                    gradeLetter: row.letter.trim() || null,
                    recordedBy: session.user.id,
                }));

            return upsertGrades(inputs);
        },
        { successMessage: (saved) => `${saved.length} calificaciones guardadas.` },
    );

    return (
        <SpaceBetween size="l">
            <ColumnLayout columns={2}>
                <FormField label="Asignatura">
                    <SubjectSelect value={subjectId} onChange={(id) => setSubjectId(id)} />
                </FormField>
                <FormField label="Periodo académico">
                    <AcademicPeriodSelect value={periodId} onChange={(id) => setPeriodId(id)} />
                </FormField>
            </ColumnLayout>

            {!subjectId || !periodId ? (
                <EmptyState
                    title="Elige asignatura y periodo"
                    description="La planilla de calificaciones aparece aquí una vez elegidos ambos."
                />
            ) : (
                <SpaceBetween size="m">
                    <FeedbackAlert error={rosterError ?? save.error} success={save.success} />

                    <DataTable
                        title={`Calificaciones — ${subject?.name ?? ''}`}
                        description="Deja la nota vacía para no registrar ese estudiante."
                        trackBy="id"
                        items={roster ?? []}
                        loading={loadingRoster}
                        loadingText="Cargando estudiantes matriculados"
                        emptyTitle="Sin estudiantes matriculados"
                        emptyDescription="No hay matrículas activas para este periodo y grado."
                        actions={
                            <Button
                                variant="primary"
                                loading={save.pending}
                                disabled={invalidCount > 0 || Object.keys(rows).length === 0}
                                onClick={() => void save.run()}
                            >
                                Guardar calificaciones
                            </Button>
                        }
                        columns={[
                            { id: 'fullName', header: 'Estudiante', cell: (item) => item.fullName },
                            { id: 'gradeLevel', header: 'Grado', cell: (item) => item.gradeLevel ?? '—' },
                            {
                                id: 'value',
                                header: 'Nota (0–10)',
                                cell: (item) => (
                                    <Input
                                        value={rows[item.id]?.value ?? ''}
                                        invalid={!isValidGradeValue(rows[item.id]?.value ?? '')}
                                        onChange={(event) =>
                                            setRows((current) => ({
                                                ...current,
                                                [item.id]: { ...current[item.id], value: event.detail.value },
                                            }))
                                        }
                                        placeholder="—"
                                        disabled={save.pending}
                                    />
                                ),
                            },
                            {
                                id: 'letter',
                                header: 'Concepto',
                                cell: (item) => (
                                    <Input
                                        value={rows[item.id]?.letter ?? ''}
                                        onChange={(event) =>
                                            setRows((current) => ({
                                                ...current,
                                                [item.id]: { ...current[item.id], letter: event.detail.value },
                                            }))
                                        }
                                        placeholder="Opcional"
                                        disabled={save.pending}
                                    />
                                ),
                            },
                        ]}
                    />

                    {invalidCount > 0 ? (
                        <Box color="text-status-error">
                            {invalidCount} {invalidCount === 1 ? 'nota está' : 'notas están'} fuera del rango 0–10.
                        </Box>
                    ) : null}
                </SpaceBetween>
            )}
        </SpaceBetween>
    );
}
