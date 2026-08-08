/**
 * Calificaciones.
 *
 * No usa la fábrica genérica: el registro de notas es una operación por lote
 * (un docente llena una planilla de un curso completo) y la clave natural es
 * `(student_id, subject_id, academic_period_id)` — `upsertGrades` corrige una
 * nota existente en vez de duplicarla, aprovechando la restricción única de
 * la tabla.
 */

import { toAppError } from '../lib/errors';
import { toGrade } from '../lib/mappers';
import { requireSupabase } from '../lib/supabase';
import type { Grade, GradeInput } from '../types';

export async function listGradesForSubjectPeriod(subjectId: string, academicPeriodId: string): Promise<Grade[]> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('grades')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('academic_period_id', academicPeriodId);

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toGrade);
}

export async function listGradesForStudent(studentId: string, academicPeriodId?: string): Promise<Grade[]> {
    const client = requireSupabase();

    let query = client.from('grades').select('*').eq('student_id', studentId);
    if (academicPeriodId) {
        query = query.eq('academic_period_id', academicPeriodId);
    }

    const { data, error } = await query;

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toGrade);
}

/** Todas las notas de un periodo, para el reporte institucional de rendimiento. */
export async function listGradesForPeriod(academicPeriodId: string): Promise<Grade[]> {
    const client = requireSupabase();

    const { data, error } = await client.from('grades').select('*').eq('academic_period_id', academicPeriodId);

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toGrade);
}

/** Crea o corrige varias notas en una sola operación (planilla de un curso). */
export async function upsertGrades(inputs: GradeInput[]): Promise<Grade[]> {
    if (inputs.length === 0) return [];

    const client = requireSupabase();

    const rows = inputs.map((input) => ({
        student_id: input.studentId,
        subject_id: input.subjectId,
        academic_period_id: input.academicPeriodId,
        grade_value: input.gradeValue,
        grade_letter: input.gradeLetter,
        recorded_by: input.recordedBy,
    }));

    const { data, error } = await client
        .from('grades')
        .upsert(rows, { onConflict: 'student_id,subject_id,academic_period_id' })
        .select('*');

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toGrade);
}

/** Promedio simple de las notas dadas; `null` si no hay ninguna. */
export function computeAverageGrade(grades: Grade[]): number | null {
    if (grades.length === 0) return null;
    const total = grades.reduce((sum, grade) => sum + grade.gradeValue, 0);
    return Math.round((total / grades.length) * 100) / 100;
}
