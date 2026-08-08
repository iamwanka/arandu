import { toAppError } from '../lib/errors';
import { fromDisciplinaryRecord, toDisciplinaryRecord } from '../lib/mappers';
import { requireSupabase } from '../lib/supabase';
import type { DisciplinaryRecord, DisciplinaryRecordInput } from '../types';
import { createResourceService } from './createResourceService';

export const disciplinaryRecordsService = createResourceService<
    'disciplinary_records',
    DisciplinaryRecord,
    DisciplinaryRecordInput
>({
    table: 'disciplinary_records',
    label: 'incidencia disciplinaria',
    toModel: toDisciplinaryRecord,
    toRow: fromDisciplinaryRecord,
    searchColumns: ['description', 'severity'],
    defaultOrderBy: 'record_date',
    defaultAscending: false,
});

export async function listDisciplinaryRecordsForStudent(studentId: string): Promise<DisciplinaryRecord[]> {
    const client = requireSupabase();

    const { data, error } = await client
        .from('disciplinary_records')
        .select('*')
        .eq('student_id', studentId)
        .order('record_date', { ascending: false });

    if (error) {
        throw toAppError(error);
    }

    return (data ?? []).map(toDisciplinaryRecord);
}
