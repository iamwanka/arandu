/**
 * Punto de entrada de la capa de datos.
 *
 * Las vistas importan desde aquí (`../../services`) y nunca desde
 * `lib/supabase` directamente: así el acceso a datos queda detrás de una sola
 * frontera y los módulos futuros no repiten consultas sueltas.
 */

export { createResourceService } from './createResourceService';
export type { ResourceService, ResourceServiceConfig } from './createResourceService';

export { academicPeriodsService, fetchActiveAcademicPeriod } from './academicPeriods';
export { enrollmentsService, hasActiveEnrollment, listEnrollmentsByStudent } from './enrollments';
export { createParentLink, listParentLinksForStudent, updateParentLinkActive } from './parentLinks';
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
