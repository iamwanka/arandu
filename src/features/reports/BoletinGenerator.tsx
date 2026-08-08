import { useState } from 'react';

import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import FormField from '@cloudscape-design/components/form-field';

import { FeedbackAlert, SectionCard, StudentSelect } from '../../components/ui';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { buildBoletinPdf } from '../../lib/pdf';
import {
    computeAttendanceRate,
    computeAverageGrade,
    generateReport,
    listAttendanceForStudent,
    listDisciplinaryRecordsForStudent,
    listGradesForStudent,
    subjectsService,
} from '../../services';
import type { AcademicPeriod, AppSession } from '../../types';
import AcademicPeriodSelect from '../academic/AcademicPeriodSelect';

interface BoletinGeneratorProps {
    session: AppSession;
}

/** Genera el boletín de un estudiante en un periodo: notas por asignatura, asistencia y disciplina. */
export default function BoletinGenerator({ session }: BoletinGeneratorProps) {
    const [studentId, setStudentId] = useState<string | null>(null);
    const [studentName, setStudentName] = useState<string | null>(null);
    const [studentCode, setStudentCode] = useState<string | null>(null);
    const [studentGrade, setStudentGrade] = useState<string | null>(null);
    const [periodId, setPeriodId] = useState<string | null>(null);
    const [period, setPeriod] = useState<AcademicPeriod | null>(null);

    const generate = useAsyncAction(
        async () => {
            const [grades, attendance, discipline, subjects] = await Promise.all([
                listGradesForStudent(studentId!, periodId!),
                listAttendanceForStudent(studentId!, { from: period!.startDate, to: period!.endDate }),
                listDisciplinaryRecordsForStudent(studentId!),
                subjectsService.list(),
            ]);

            const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
            const gradesBySubject = new Map<string, number[]>();
            for (const grade of grades) {
                const values = gradesBySubject.get(grade.subjectId) ?? [];
                values.push(grade.gradeValue);
                gradesBySubject.set(grade.subjectId, values);
            }
            const subjectAverages = Array.from(gradesBySubject.entries()).map(([subjectId, values]) => ({
                subjectName: subjectById.get(subjectId)?.name ?? subjectId,
                average: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100,
            }));

            const disciplineInPeriod = discipline.filter(
                (record) => record.recordDate >= period!.startDate && record.recordDate <= period!.endDate,
            );

            const doc = buildBoletinPdf({
                studentName: studentName ?? '—',
                studentCode,
                gradeLevel: studentGrade,
                academicPeriodName: period!.name,
                subjectAverages,
                overallAverage: computeAverageGrade(grades),
                attendanceRate: computeAttendanceRate(attendance),
                disciplineCount: disciplineInPeriod.length,
                generatedByName: session.user.name,
            });

            const report = await generateReport({
                id: crypto.randomUUID(),
                reportType: 'boletin',
                studentId: studentId!,
                academicPeriodId: periodId!,
                gradeLevel: studentGrade,
                generatedBy: session.user.id,
                pdfBlob: doc.output('blob'),
            });

            doc.save(`boletin-${(studentName ?? 'estudiante').replace(/\s+/g, '_')}.pdf`);

            return report;
        },
        { successMessage: 'Boletín generado y descargado.' },
    );

    const canGenerate = Boolean(studentId && periodId);

    return (
        <SectionCard title="Generar boletín" description="Notas, asistencia y disciplina de un estudiante en un periodo académico.">
            <FeedbackAlert error={generate.error} success={generate.success} />

            <ColumnLayout columns={2}>
                <FormField label="Estudiante">
                    <StudentSelect
                        value={studentId}
                        onChange={(id, student) => {
                            setStudentId(id);
                            setStudentName(student?.fullName ?? null);
                            setStudentCode(student?.studentCode ?? null);
                            setStudentGrade(student?.gradeLevel ?? null);
                        }}
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
                Generar y descargar boletín
            </Button>
        </SectionCard>
    );
}
