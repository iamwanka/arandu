/**
 * Traducción entre las filas de Supabase (snake_case) y los modelos de dominio
 * (camelCase). Mantener esta capa aislada evita que la forma de la base de
 * datos se filtre hacia las vistas.
 */

import type {
    AcademicPeriodRow,
    EnrollmentRow,
    ParentStudentRelationshipRow,
    ProfileRow,
    StudentRow,
    SubjectRow,
    TeacherRow,
} from './database.types';

import type {
    AcademicPeriod,
    AcademicPeriodInput,
    AppUser,
    Enrollment,
    EnrollmentInput,
    ParentStudentLink,
    Profile,
    Student,
    StudentInput,
    Subject,
    SubjectInput,
    Teacher,
    TeacherInput,
} from '../types';

/** Elimina las claves `undefined` para no sobrescribir columnas en un update parcial. */
function compact<T extends object>(value: T): Partial<T> {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/* ---------------------------------- Perfiles --------------------------------- */

export function toProfile(row: ProfileRow): Profile {
    return {
        id: row.id,
        email: row.email,
        name: row.full_name ?? row.email,
        role: row.role,
        phone: row.phone,
        active: row.active,
        createdAt: row.created_at,
    };
}

/** Vista reducida del perfil usada por la sesión y el panel de usuarios. */
export function toAppUser(row: ProfileRow): AppUser {
    return {
        id: row.id,
        email: row.email,
        name: row.full_name ?? row.email,
        role: row.role,
        active: row.active,
    };
}

/* -------------------------------- Estudiantes -------------------------------- */

export function toStudent(row: StudentRow): Student {
    return {
        id: row.id,
        profileId: row.profile_id,
        studentCode: row.student_code,
        fullName: row.full_name,
        birthDate: row.birth_date,
        gradeLevel: row.grade_level,
        address: row.address,
        phone: row.phone,
        createdAt: row.created_at,
    };
}

export function fromStudent(input: Partial<StudentInput>): Partial<StudentRow> {
    return compact({
        profile_id: input.profileId,
        student_code: input.studentCode,
        full_name: input.fullName,
        birth_date: input.birthDate,
        grade_level: input.gradeLevel,
        address: input.address,
        phone: input.phone,
    });
}

/* ---------------------------------- Docentes --------------------------------- */

export function toTeacher(row: TeacherRow): Teacher {
    return {
        id: row.id,
        profileId: row.profile_id,
        teacherCode: row.teacher_code,
        fullName: row.full_name,
        specialty: row.specialty,
        email: row.email,
        phone: row.phone,
        active: row.active,
        createdAt: row.created_at,
    };
}

export function fromTeacher(input: Partial<TeacherInput>): Partial<TeacherRow> {
    return compact({
        profile_id: input.profileId,
        teacher_code: input.teacherCode,
        full_name: input.fullName,
        specialty: input.specialty,
        email: input.email,
        phone: input.phone,
        active: input.active,
    });
}

/* -------------------------------- Asignaturas -------------------------------- */

export function toSubject(row: SubjectRow): Subject {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        gradeLevel: row.grade_level,
        teacherId: row.teacher_id,
        active: row.active,
        createdAt: row.created_at,
    };
}

export function fromSubject(input: Partial<SubjectInput>): Partial<SubjectRow> {
    return compact({
        code: input.code,
        name: input.name,
        grade_level: input.gradeLevel,
        teacher_id: input.teacherId,
        active: input.active,
    });
}

/* ----------------------------- Periodos académicos --------------------------- */

export function toAcademicPeriod(row: AcademicPeriodRow): AcademicPeriod {
    return {
        id: row.id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: row.is_active,
        createdAt: row.created_at,
    };
}

export function fromAcademicPeriod(input: Partial<AcademicPeriodInput>): Partial<AcademicPeriodRow> {
    return compact({
        name: input.name,
        start_date: input.startDate,
        end_date: input.endDate,
        is_active: input.isActive,
    });
}

/* --------------------------------- Matrículas -------------------------------- */

export function toEnrollment(row: EnrollmentRow): Enrollment {
    return {
        id: row.id,
        studentId: row.student_id,
        academicPeriodId: row.academic_period_id,
        gradeLevel: row.grade_level,
        status: row.status,
        enrollmentDate: row.enrollment_date,
        certificateUrl: row.certificate_url,
        createdAt: row.created_at,
    };
}

export function fromEnrollment(input: Partial<EnrollmentInput>): Partial<EnrollmentRow> {
    return compact({
        student_id: input.studentId,
        academic_period_id: input.academicPeriodId,
        grade_level: input.gradeLevel,
        status: input.status,
        enrollment_date: input.enrollmentDate,
        certificate_url: input.certificateUrl,
    });
}

/* ------------------------- Relación acudiente/estudiante --------------------- */

export function toParentStudentLink(row: ParentStudentRelationshipRow): ParentStudentLink {
    return {
        id: row.id,
        parentProfileId: row.parent_profile_id,
        studentId: row.student_id,
        relationship: row.relationship,
        active: row.active,
        createdAt: row.created_at,
    };
}
