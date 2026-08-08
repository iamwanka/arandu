/**
 * Traducción entre las filas de Supabase (snake_case) y los modelos de dominio
 * (camelCase). Mantener esta capa aislada evita que la forma de la base de
 * datos se filtre hacia las vistas.
 */

import type {
    AcademicPeriodRow,
    AttendanceRow,
    DisciplinaryRecordRow,
    EnrollmentRow,
    GeneratedReportRow,
    GradeRow,
    ParentStudentRelationshipRow,
    ProfileRow,
    ScheduleRow,
    StudentRow,
    SubjectRow,
    TeacherRow,
} from './database.types';

import type {
    AcademicPeriod,
    AcademicPeriodInput,
    Attendance,
    AttendanceInput,
    AppUser,
    DayOfWeek,
    DisciplinaryRecord,
    DisciplinaryRecordInput,
    Enrollment,
    EnrollmentInput,
    GeneratedReport,
    GeneratedReportInput,
    Grade,
    GradeInput,
    ParentStudentLink,
    Profile,
    Schedule,
    ScheduleInput,
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

/* ------------------------------- Calificaciones ------------------------------ */

export function toGrade(row: GradeRow): Grade {
    return {
        id: row.id,
        studentId: row.student_id,
        subjectId: row.subject_id,
        academicPeriodId: row.academic_period_id,
        gradeValue: Number(row.grade_value),
        gradeLetter: row.grade_letter,
        recordedBy: row.recorded_by,
        createdAt: row.created_at,
    };
}

export function fromGrade(input: Partial<GradeInput>): Partial<GradeRow> {
    return compact({
        student_id: input.studentId,
        subject_id: input.subjectId,
        academic_period_id: input.academicPeriodId,
        grade_value: input.gradeValue,
        grade_letter: input.gradeLetter,
        recorded_by: input.recordedBy,
    });
}

/* --------------------------------- Asistencia --------------------------------- */

export function toAttendance(row: AttendanceRow): Attendance {
    return {
        id: row.id,
        studentId: row.student_id,
        attendanceDate: row.attendance_date,
        status: row.status,
        recordedBy: row.recorded_by,
        createdAt: row.created_at,
    };
}

export function fromAttendance(input: Partial<AttendanceInput>): Partial<AttendanceRow> {
    return compact({
        student_id: input.studentId,
        attendance_date: input.attendanceDate,
        status: input.status,
        recorded_by: input.recordedBy,
    });
}

/* ---------------------------------- Horarios ---------------------------------- */

export function toSchedule(row: ScheduleRow): Schedule {
    return {
        id: row.id,
        gradeLevel: row.grade_level,
        dayOfWeek: row.day_of_week as DayOfWeek,
        startTime: row.start_time,
        endTime: row.end_time,
        subjectId: row.subject_id,
        teacherId: row.teacher_id,
        classroom: row.classroom,
        createdAt: row.created_at,
    };
}

export function fromSchedule(input: Partial<ScheduleInput>): Partial<ScheduleRow> {
    return compact({
        grade_level: input.gradeLevel,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
        subject_id: input.subjectId,
        teacher_id: input.teacherId,
        classroom: input.classroom,
    });
}

/* -------------------------------- Disciplina ---------------------------------- */

export function toDisciplinaryRecord(row: DisciplinaryRecordRow): DisciplinaryRecord {
    return {
        id: row.id,
        studentId: row.student_id,
        recordDate: row.record_date,
        severity: row.severity,
        description: row.description,
        responsibleId: row.responsible_id,
        notifiedParent: row.notified_parent,
        createdAt: row.created_at,
    };
}

export function fromDisciplinaryRecord(input: Partial<DisciplinaryRecordInput>): Partial<DisciplinaryRecordRow> {
    return compact({
        student_id: input.studentId,
        record_date: input.recordDate,
        severity: input.severity,
        description: input.description,
        responsible_id: input.responsibleId,
        notified_parent: input.notifiedParent,
    });
}

/* --------------------------------- Reportes ------------------------------- */

export function toGeneratedReport(row: GeneratedReportRow): GeneratedReport {
    return {
        id: row.id,
        studentId: row.student_id,
        reportType: row.report_type,
        fileUrl: row.file_url,
        academicPeriodId: row.academic_period_id,
        gradeLevel: row.grade_level,
        generatedBy: row.generated_by,
        generatedAt: row.generated_at,
    };
}

export function fromGeneratedReport(input: Partial<GeneratedReportInput>): Partial<GeneratedReportRow> {
    return compact({
        id: input.id,
        student_id: input.studentId,
        report_type: input.reportType,
        file_url: input.fileUrl,
        academic_period_id: input.academicPeriodId,
        grade_level: input.gradeLevel,
        generated_by: input.generatedBy,
    });
}
