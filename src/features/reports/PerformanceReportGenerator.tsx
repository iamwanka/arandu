import { useMemo, useState } from 'react';

import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';

import { DataTable, FeedbackAlert, SectionCard } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncData } from '../../hooks/useAsyncData';
import { buildPerformanceReportPdf, type PerformanceReportRow } from '../../lib/pdf';
import { generateReport, listGradesForPeriod, studentsService } from '../../services';
import type { AcademicPeriod, AppSession } from '../../types';
import AcademicPeriodSelect from '../academic/AcademicPeriodSelect';

interface PerformanceReportGeneratorProps {
    session: AppSession;
}

/** Reporte institucional de rendimiento: promedio de calificaciones por estudiante de un grado, en un periodo. */
export default function PerformanceReportGenerator({ session }: PerformanceReportGeneratorProps) {
    const { data: students } = useAsyncData(() => studentsService.list(), []);
    const gradeLevels = useMemo(
        () =>
            Array.from(
                new Set((students ?? []).map((student) => student.gradeLevel).filter((grade): grade is string => Boolean(grade))),
            ).sort(),
        [students],
    );

    const [gradeLevel, setGradeLevel] = useState<string | null>(null);
    const [periodId, setPeriodId] = useState<string | null>(null);
    const [period, setPeriod] = useState<AcademicPeriod | null>(null);
    const [previewRows, setPreviewRows] = useState<PerformanceReportRow[]>([]);

    const generate = useAsyncAction(
        async () => {
            const gradeStudents = (students ?? []).filter((student) => student.gradeLevel === gradeLevel);
            const grades = await listGradesForPeriod(periodId!);

            const gradesByStudent = new Map<string, number[]>();
            for (const grade of grades) {
                const values = gradesByStudent.get(grade.studentId) ?? [];
                values.push(grade.gradeValue);
                gradesByStudent.set(grade.studentId, values);
            }

            const rows: PerformanceReportRow[] = gradeStudents
                .map((student) => {
                    const values = gradesByStudent.get(student.id) ?? [];
                    return {
                        studentId: student.id,
                        studentName: student.fullName,
                        gradesCount: values.length,
                        average: values.length > 0 ? Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100 : null,
                    };
                })
                .sort((a, b) => a.studentName.localeCompare(b.studentName));

            const doc = buildPerformanceReportPdf({
                gradeLevel: gradeLevel!,
                academicPeriodName: period!.name,
                rows,
                generatedByName: session.user.name,
            });

            const report = await generateReport({
                id: crypto.randomUUID(),
                reportType: 'rendimiento',
                studentId: null,
                academicPeriodId: periodId!,
                gradeLevel,
                generatedBy: session.user.id,
                pdfBlob: doc.output('blob'),
            });

            doc.save(`rendimiento-${gradeLevel}.pdf`);
            setPreviewRows(rows);

            return report;
        },
        { successMessage: 'Reporte de rendimiento generado y descargado.' },
    );

    const canGenerate = Boolean(gradeLevel && periodId);

    return (
        <SectionCard title="Reporte de rendimiento" description="Promedio de calificaciones por estudiante de un grado, en un periodo académico.">
            <FeedbackAlert error={generate.error} success={generate.success} />

            <ColumnLayout columns={2}>
                <FormField label="Grado o curso">
                    <Select
                        selectedOption={gradeLevel ? { label: gradeLevel, value: gradeLevel } : null}
                        onChange={({ detail }) => setGradeLevel(detail.selectedOption.value ?? null)}
                        options={gradeLevels.map((grade) => ({ label: grade, value: grade }))}
                        placeholder="Selecciona un grado"
                        empty="No hay estudiantes registrados."
                        disabled={generate.pending}
                    />
                </FormField>
                <FormField label="Periodo académico">
                    <AcademicPeriodSelect
                        value={periodId}
                        onChange={(id, selectedPeriod) => {
                            setPeriodId(id);
                            setPeriod(selectedPeriod);
                        }}
                        disabled={generate.pending}
                    />
                </FormField>
            </ColumnLayout>

            <Button variant="primary" loading={generate.pending} disabled={!canGenerate} onClick={() => void generate.run()}>
                Generar y descargar reporte
            </Button>

            {previewRows.length > 0 ? (
                <DataTable
                    title="Vista previa"
                    trackBy="studentId"
                    items={previewRows}
                    columns={[
                        { id: 'student', header: 'Estudiante', cell: (item) => item.studentName },
                        { id: 'count', header: 'Notas registradas', cell: (item) => item.gradesCount },
                        { id: 'average', header: 'Promedio', cell: (item) => (item.average !== null ? item.average.toFixed(2) : '—') },
                    ]}
                />
            ) : null}
        </SectionCard>
    );
}
