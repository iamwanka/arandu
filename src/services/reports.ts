/**
 * Reportes generados: boletines por estudiante y reportes institucionales
 * (asistencia/rendimiento por grado). El PDF se sube al bucket privado de
 * Storage `reports` y la fila de `generated_reports` deja la traza de quién,
 * cuándo y para quién se generó — así "historial de reportes" no depende de
 * volver a generar el documento.
 */

import { toAppError } from '../lib/errors';
import { fromGeneratedReport, toGeneratedReport } from '../lib/mappers';
import { requireSupabase } from '../lib/supabase';
import type { GeneratedReport, GeneratedReportInput } from '../types';
import { createResourceService } from './createResourceService';

export const generatedReportsService = createResourceService<
    'generated_reports',
    GeneratedReport,
    GeneratedReportInput
>({
    table: 'generated_reports',
    label: 'reporte',
    toModel: toGeneratedReport,
    toRow: fromGeneratedReport,
    defaultOrderBy: 'generated_at',
    defaultAscending: false,
});

export async function listGeneratedReportsForStudent(studentId: string): Promise<GeneratedReport[]> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('generated_reports')
        .select('*')
        .eq('student_id', studentId)
        .order('generated_at', { ascending: false });

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toGeneratedReport);
}

/** Ruta del objeto en Storage: primer segmento = student_id, o "institutional" si no aplica. */
function buildReportPath(id: string, studentId: string | null): string {
    return `${studentId ?? 'institutional'}/${id}.pdf`;
}

/**
 * Sube el PDF ya generado y registra la fila de historial en una sola
 * operación. `id` lo genera el llamador (`crypto.randomUUID()`) porque hace
 * falta para construir la ruta de Storage antes de insertar la fila.
 */
export async function generateReport(input: {
    id: string;
    reportType: string;
    studentId: string | null;
    academicPeriodId: string | null;
    gradeLevel: string | null;
    generatedBy: string;
    pdfBlob: Blob;
}): Promise<GeneratedReport> {
    const client = requireSupabase();
    const path = buildReportPath(input.id, input.studentId);

    const { error: uploadError } = await client.storage.from('reports').upload(path, input.pdfBlob, {
        contentType: 'application/pdf',
        upsert: false,
    });

    if (uploadError) {
        throw toAppError(uploadError);
    }

    return generatedReportsService.create({
        id: input.id,
        studentId: input.studentId,
        reportType: input.reportType,
        fileUrl: path,
        academicPeriodId: input.academicPeriodId,
        gradeLevel: input.gradeLevel,
        generatedBy: input.generatedBy,
    });
}

/** Descarga el PDF guardado en Storage para un reporte del historial. */
export async function downloadReportFile(fileUrl: string): Promise<Blob> {
    const client = requireSupabase();

    const { data, error } = await client.storage.from('reports').download(fileUrl);

    if (error) {
        throw toAppError(error);
    }

    return data;
}
