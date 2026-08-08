/**
 * Punto de entrada de la capa de datos.
 *
 * Las vistas importan desde aquí (`../../services`) y nunca desde
 * `lib/supabase` directamente: así el acceso a datos queda detrás de una sola
 * frontera y los módulos futuros no repiten consultas sueltas.
 */

export { createResourceService } from './createResourceService';
export type { ResourceService, ResourceServiceConfig } from './createResourceService';

export {
    computeAttendanceRate,
    listAttendanceForDate,
    listAttendanceForRange,
    listAttendanceForStudent,
    upsertAttendance,
} from './attendance';
export { academicPeriodsService, fetchActiveAcademicPeriod } from './academicPeriods';
export { disciplinaryRecordsService, listDisciplinaryRecordsForStudent } from './disciplinaryRecords';
export { enrollmentsService, hasActiveEnrollment, listEnrollmentsByStudent } from './enrollments';
export {
    computeAverageGrade,
    listGradesForPeriod,
    listGradesForStudent,
    listGradesForSubjectPeriod,
    upsertGrades,
} from './grades';
export { createParentLink, listParentLinksForStudent, updateParentLinkActive } from './parentLinks';
export {
    downloadReportFile,
    generateReport,
    generatedReportsService,
    listGeneratedReportsForStudent,
} from './reports';
export { hasScheduleConflict, schedulesService } from './schedules';
export {
    fetchProfileByEmail,
    fetchProfileById,
    listProfiles,
    listProfilesByRole,
    updateProfileActive,
    updateProfileRole,
    upsertProfile,
} from './profiles';
export { studentsService } from './students';
export { subjectsService } from './subjects';
export { teachersService } from './teachers';
