import { fromSubject, toSubject } from '../lib/mappers';
import type { Subject, SubjectInput } from '../types';
import { createResourceService } from './createResourceService';

export const subjectsService = createResourceService<'subjects', Subject, SubjectInput>({
    table: 'subjects',
    label: 'asignatura',
    toModel: toSubject,
    toRow: fromSubject,
    searchColumns: ['name', 'code', 'grade_level'],
    defaultOrderBy: 'name',
    defaultAscending: true,
});
