import { toAppError } from '../lib/errors';
import { fromEnrollment, toEnrollment } from '../lib/mappers';
import { requireSupabase } from '../lib/supabase';
import type { Enrollment, EnrollmentInput } from '../types';
import { createResourceService } from './createResourceService';

export const enrollmentsService = createResourceService<'enrollments', Enrollment, EnrollmentInput>({
    table: 'enrollments',
    label: 'matrícula',
    toModel: toEnrollment,
    toRow: fromEnrollment,
    searchColumns: ['grade_level'],
    defaultOrderBy: 'enrollment_date',
    defaultAscending: false,
});

export async function listEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)
        .order('enrollment_date', { ascending: false });

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toEnrollment);
}

/**
 * Regla de negocio del Sprint 3: un estudiante no puede tener dos matrículas
 * activas en el mismo periodo. Se expone desde ya para que el flujo de
 * matrícula la consuma sin reimplementarla.
 */
export async function hasActiveEnrollment(studentId: string, academicPeriodId: string): Promise<boolean> {
    const client = requireSupabase();

    const { count, error } = await client
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('academic_period_id', academicPeriodId)
        .eq('status', 'active');

    if (error) {
        throw toAppError(error);
    }

    return (count ?? 0) > 0;
}
