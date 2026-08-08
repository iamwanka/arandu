import { fromTeacher, toTeacher } from '../lib/mappers';
import type { Teacher, TeacherInput } from '../types';
import { createResourceService } from './createResourceService';

export const teachersService = createResourceService<'teachers', Teacher, TeacherInput>({
    table: 'teachers',
    label: 'docente',
    toModel: toTeacher,
    toRow: fromTeacher,
    searchColumns: ['full_name', 'teacher_code', 'specialty', 'email'],
    defaultOrderBy: 'full_name',
    defaultAscending: true,
});
