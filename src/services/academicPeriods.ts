import { fromAcademicPeriod, toAcademicPeriod } from '../lib/mappers';
import { toAppError } from '../lib/errors';
import { requireSupabase } from '../lib/supabase';
import type { AcademicPeriod, AcademicPeriodInput } from '../types';
import { createResourceService } from './createResourceService';

export const academicPeriodsService = createResourceService<'academic_periods', AcademicPeriod, AcademicPeriodInput>({
    table: 'academic_periods',
    label: 'periodo académico',
    toModel: toAcademicPeriod,
    toRow: fromAcademicPeriod,
    searchColumns: ['name'],
    defaultOrderBy: 'start_date',
    defaultAscending: false,
});

/**
 * Periodo vigente. Casi todos los módulos académicos lo necesitan como
 * contexto por defecto (matrícula, notas, asistencia).
 */
export async function fetchActiveAcademicPeriod(): Promise<AcademicPeriod | null> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('academic_periods')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw toAppError(error);
    }

    return data ? toAcademicPeriod(data) : null;
}
