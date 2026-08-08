import { fromStudent, toStudent } from '../lib/mappers';
import type { Student, StudentInput } from '../types';
import { createResourceService } from './createResourceService';

export const studentsService = createResourceService<'students', Student, StudentInput>({
    table: 'students',
    label: 'estudiante',
    toModel: toStudent,
    toRow: fromStudent,
    searchColumns: ['full_name', 'student_code', 'grade_level'],
    defaultOrderBy: 'full_name',
    defaultAscending: true,
});
