import { toAppError } from '../lib/errors';
import { fromSchedule, toSchedule } from '../lib/mappers';
import { requireSupabase } from '../lib/supabase';
import type { DayOfWeek, Schedule, ScheduleInput } from '../types';
import { createResourceService } from './createResourceService';

export const schedulesService = createResourceService<'schedules', Schedule, ScheduleInput>({
    table: 'schedules',
    label: 'horario',
    toModel: toSchedule,
    toRow: fromSchedule,
    searchColumns: ['grade_level', 'classroom'],
    defaultOrderBy: 'day_of_week',
    defaultAscending: true,
});

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes ?? 0);
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

/**
 * Regla de negocio del Sprint 5: un docente o un aula no pueden tener dos
 * clases que se solapen el mismo día. Se valida en la aplicación (no hay
 * columna calculada ni `exclusion constraint` en la base para esto).
 */
export async function hasScheduleConflict(input: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    teacherId: string | null;
    classroom: string | null;
    excludeId?: string;
}): Promise<boolean> {
    if (!input.teacherId && !input.classroom) return false;

    const client = requireSupabase();

    let query = client.from('schedules').select('*').eq('day_of_week', input.dayOfWeek);
    if (input.excludeId) {
        query = query.neq('id', input.excludeId);
    }

    const { data, error } = await query;

    if (error) {
        throw toAppError(error);
    }

    return (data ?? [])
        .map(toSchedule)
        .some(
            (existing) =>
                overlaps(input.startTime, input.endTime, existing.startTime, existing.endTime) &&
                ((input.teacherId && existing.teacherId === input.teacherId) ||
                    (input.classroom && existing.classroom === input.classroom)),
        );
}
