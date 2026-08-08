/**
 * Modelos de dominio de Arandu.
 *
 * Estos tipos son los que consumen las vistas y los hooks. Usan camelCase y no
 * dependen de la forma exacta que devuelve Supabase: la traducción desde las
 * filas de la base de datos vive en `src/lib/mappers.ts`.
 */

/* ------------------------------------------------------------------ */
/* Roles y sesión                                                      */
/* ------------------------------------------------------------------ */

export type AppRole = 'admin' | 'coordinator' | 'teacher' | 'student' | 'parent';

export const APP_ROLES: AppRole[] = ['admin', 'coordinator', 'teacher', 'student', 'parent'];

/** Todos los roles del sistema. Atajo para rutas y vistas públicas a la sesión. */
export const ALL_ROLES: AppRole[] = APP_ROLES;

/** Roles con capacidad de gestión académica. */
export const STAFF_ROLES: AppRole[] = ['admin', 'coordinator', 'teacher'];

export function isAppRole(value: unknown): value is AppRole {
    return typeof value === 'string' && (APP_ROLES as string[]).includes(value);
}

export interface AppUser {
    id: string;
    email: string;
    name: string;
    role: AppRole;
    /** Cuenta habilitada para iniciar sesión. Una cuenta inactiva se cierra automáticamente. */
    active: boolean;
}

export interface AppSession {
    user: AppUser;
    accessToken: string;
    mode: 'supabase';
}

/* ------------------------------------------------------------------ */
/* Estados compartidos                                                 */
/* ------------------------------------------------------------------ */

export type EnrollmentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';

export type AttendanceStatus = 'present' | 'absent' | 'justified';

/* ------------------------------------------------------------------ */
/* Modelos base                                                        */
/* ------------------------------------------------------------------ */

/** Perfil de usuario. Es la identidad única del sistema; todo lo demás cuelga de aquí. */
export interface Profile {
    id: string;
    email: string;
    /** Nombre completo. Cae al correo cuando el perfil aún no tiene nombre. */
    name: string;
    role: AppRole;
    phone: string | null;
    active: boolean;
    createdAt: string;
}

export interface Student {
    id: string;
    profileId: string;
    studentCode: string | null;
    fullName: string;
    birthDate: string | null;
    gradeLevel: string | null;
    address: string | null;
    phone: string | null;
    createdAt: string;
}

export interface Teacher {
    id: string;
    profileId: string;
    teacherCode: string | null;
    fullName: string;
    specialty: string | null;
    email: string | null;
    phone: string | null;
    active: boolean;
    createdAt: string;
}

export interface Subject {
    id: string;
    code: string;
    name: string;
    gradeLevel: string | null;
    teacherId: string | null;
    active: boolean;
    createdAt: string;
}

export interface AcademicPeriod {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
}

export interface Enrollment {
    id: string;
    studentId: string;
    academicPeriodId: string;
    gradeLevel: string;
    status: EnrollmentStatus;
    enrollmentDate: string;
    certificateUrl: string | null;
    createdAt: string;
}

/** Vínculo entre un acudiente y un estudiante. */
export interface ParentStudentLink {
    id: string;
    parentProfileId: string;
    studentId: string;
    relationship: string;
    active: boolean;
    createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Entradas de formulario                                              */
/* ------------------------------------------------------------------ */

/**
 * `*Input` es lo que envía un formulario: sin campos generados por la base de
 * datos (`id`, `createdAt`). El `Partial` correspondiente sirve para editar.
 */
export type StudentInput = Omit<Student, 'id' | 'createdAt'>;
export type StudentPatch = Partial<StudentInput>;

export type TeacherInput = Omit<Teacher, 'id' | 'createdAt'>;
export type TeacherPatch = Partial<TeacherInput>;

export type SubjectInput = Omit<Subject, 'id' | 'createdAt'>;
export type SubjectPatch = Partial<SubjectInput>;

export type AcademicPeriodInput = Omit<AcademicPeriod, 'id' | 'createdAt'>;
export type AcademicPeriodPatch = Partial<AcademicPeriodInput>;

export type EnrollmentInput = Omit<Enrollment, 'id' | 'createdAt'>;
export type EnrollmentPatch = Partial<EnrollmentInput>;

export type ProfileInput = Omit<Profile, 'createdAt'>;

/* ------------------------------------------------------------------ */
/* Consultas                                                           */
/* ------------------------------------------------------------------ */

/** Filtros comunes de listado, aceptados por los servicios de datos. */
export interface ListQuery {
    /** Búsqueda de texto libre sobre los campos principales de la entidad. */
    search?: string;
    /** Página basada en cero. */
    page?: number;
    pageSize?: number;
    orderBy?: string;
    ascending?: boolean;
}

export interface PagedResult<T> {
    items: T[];
    total: number;
}
