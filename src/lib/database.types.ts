/**
 * Contrato de la base de datos de Supabase.
 *
 * Refleja `supabase/schema.sql` en tipos de TypeScript usando snake_case, tal
 * como devuelve PostgREST. La capa de servicios traduce estas filas a los
 * modelos de dominio en camelCase declarados en `src/types.ts`.
 *
 * Al agregar o modificar una tabla en el esquema SQL, actualiza también este
 * archivo: es la única fuente de verdad que tipa las consultas del cliente.
 */

/**
 * Construye la tripleta Row/Insert/Update que espera `@supabase/supabase-js`.
 * `Generated` son las columnas que la base de datos completa por defecto y que
 * por lo tanto son opcionales al insertar.
 */
type TableDefinition<Row, Generated extends keyof Row = never> = {
    Row: Row;
    Insert: Omit<Row, Generated> & Partial<Pick<Row, Generated>>;
    Update: Partial<Row>;
    Relationships: [];
};

export type DbRole = 'admin' | 'coordinator' | 'teacher' | 'student' | 'parent';
export type DbEnrollmentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';
export type DbAttendanceStatus = 'present' | 'absent' | 'justified';

export type ProfileRow = {
    id: string;
    role: DbRole;
    full_name: string;
    email: string;
    phone: string | null;
    active: boolean;
    created_at: string;
};

export type StudentRow = {
    id: string;
    profile_id: string;
    student_code: string | null;
    full_name: string;
    birth_date: string | null;
    grade_level: string | null;
    address: string | null;
    phone: string | null;
    created_at: string;
};

export type TeacherRow = {
    id: string;
    profile_id: string;
    teacher_code: string | null;
    full_name: string;
    specialty: string | null;
    email: string | null;
    phone: string | null;
    active: boolean;
    created_at: string;
};

export type ParentStudentRelationshipRow = {
    id: string;
    parent_profile_id: string;
    student_id: string;
    relationship: string;
    active: boolean;
    created_at: string;
};

export type SubjectRow = {
    id: string;
    code: string;
    name: string;
    grade_level: string | null;
    teacher_id: string | null;
    active: boolean;
    created_at: string;
};

export type AcademicPeriodRow = {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
};

export type EnrollmentRow = {
    id: string;
    student_id: string;
    academic_period_id: string;
    grade_level: string;
    status: DbEnrollmentStatus;
    enrollment_date: string;
    certificate_url: string | null;
    created_at: string;
};

export type ScheduleRow = {
    id: string;
    grade_level: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    subject_id: string;
    teacher_id: string | null;
    classroom: string | null;
    created_at: string;
};

export type AttendanceRow = {
    id: string;
    student_id: string;
    attendance_date: string;
    status: DbAttendanceStatus;
    recorded_by: string;
    created_at: string;
};

export type GradeRow = {
    id: string;
    student_id: string;
    subject_id: string;
    academic_period_id: string;
    grade_value: number;
    grade_letter: string | null;
    recorded_by: string;
    created_at: string;
};

export type DisciplinaryRecordRow = {
    id: string;
    student_id: string;
    record_date: string;
    severity: string;
    description: string;
    responsible_id: string;
    notified_parent: boolean;
    created_at: string;
};

export type GeneratedReportRow = {
    id: string;
    student_id: string | null;
    report_type: string;
    file_url: string;
    generated_by: string;
    generated_at: string;
};

export type Database = {
    public: {
        Tables: {
            profiles: TableDefinition<ProfileRow, 'created_at' | 'phone' | 'active'>;
            students: TableDefinition<StudentRow, 'id' | 'created_at'>;
            teachers: TableDefinition<TeacherRow, 'id' | 'created_at' | 'active'>;
            parent_student_relationships: TableDefinition<
                ParentStudentRelationshipRow,
                'id' | 'created_at' | 'relationship' | 'active'
            >;
            subjects: TableDefinition<SubjectRow, 'id' | 'created_at' | 'active'>;
            academic_periods: TableDefinition<AcademicPeriodRow, 'id' | 'created_at' | 'is_active'>;
            enrollments: TableDefinition<EnrollmentRow, 'id' | 'created_at' | 'status' | 'enrollment_date'>;
            schedules: TableDefinition<ScheduleRow, 'id' | 'created_at'>;
            attendance: TableDefinition<AttendanceRow, 'id' | 'created_at'>;
            grades: TableDefinition<GradeRow, 'id' | 'created_at'>;
            disciplinary_records: TableDefinition<
                DisciplinaryRecordRow,
                'id' | 'created_at' | 'record_date' | 'notified_parent'
            >;
            generated_reports: TableDefinition<GeneratedReportRow, 'id' | 'generated_at'>;
        };
        Views: Record<string, never>;
        Functions: {
            is_admin: {
                Args: Record<string, never>;
                Returns: boolean;
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};

/** Nombres de tabla válidos, útil para servicios genéricos. */
export type TableName = keyof Database['public']['Tables'];
