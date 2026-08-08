import { useMemo, useState } from 'react';

import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';

import { DataTable, FeedbackAlert, SectionCard } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useAsyncData } from '../../hooks/useAsyncData';
import { buildAttendanceReportPdf, type AttendanceReportRow } from '../../lib/pdf';
import { computeAttendanceRate, generateReport, listAttendanceForRange, studentsService } from '../../services';
import type { AcademicPeriod, AppSession } from '../../types';
import AcademicPeriodSelect from '../academic/AcademicPeriodSelect';

interface AttendanceReportGeneratorProps {
    session: AppSession;
}

/** Reporte institucional de asistencia: todos los estudiantes de un grado en un periodo. */
export default function AttendanceReportGenerator({ session }: AttendanceReportGeneratorProps) {
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
    const [previewRows, setPreviewRows] = useState<AttendanceReportRow[]>([]);

    const generate = useAsyncAction(
        async () => {
            const gradeStudents = (students ?? []).filter((student) => student.gradeLevel === gradeLevel);
            const attendance = await listAttendanceForRange(period!.startDate, period!.endDate);

            const attendanceByStudent = new Map<string, typeof attendance>();
            for (const record of attendance) {
                const list = attendanceByStudent.get(record.studentId) ?? [];
                list.push(record);
                attendanceByStudent.set(record.studentId, list);
            }

            const rows: AttendanceReportRow[] = gradeStudents
                .map((student) => {
                    const records = attendanceByStudent.get(student.id) ?? [];
                    return {
                        studentId: student.id,
                        studentName: student.fullName,
                        daysRecorded: records.length,
                        daysPresent: records.filter((record) => record.status !== 'absent').length,
                        rate: computeAttendanceRate(records),
                    };
                })
                .sort((a, b) => a.studentName.localeCompare(b.studentName));

            const doc = buildAttendanceReportPdf({
                gradeLevel: gradeLevel!,
                academicPeriodName: period!.name,
                rows,
                generatedByName: session.user.name,
            });

            const report = await generateReport({
                id: crypto.randomUUID(),
                reportType: 'asistencia',
                studentId: null,
                academicPeriodId: periodId!,
                gradeLevel,
                generatedBy: session.user.id,
                pdfBlob: doc.output('blob'),
            });

            doc.save(`asistencia-${gradeLevel}.pdf`);
            setPreviewRows(rows);

            return report;
        },
        { successMessage: 'Reporte de asistencia generado y descargado.' },
    );

    const canGenerate = Boolean(gradeLevel && periodId);

    return (
        <SectionCard title="Reporte de asistencia" description="Asistencia por estudiante de un grado, en un periodo académico.">
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
                        { id: 'days', header: 'Días registrados', cell: (item) => item.daysRecorded },
                        { id: 'rate', header: 'Asistencia', cell: (item) => (item.rate !== null ? `${item.rate}%` : '—') },
                    ]}
                />
            ) : null}
        </SectionCard>
    );
}
