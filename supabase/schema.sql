create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'coordinator', 'teacher', 'student', 'parent')),
  full_name text not null,
  email text not null unique,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  student_code text unique,
  full_name text not null,
  birth_date date,
  grade_level text,
  address text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  teacher_code text unique,
  full_name text not null,
  specialty text,
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.parent_student_relationships (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  relationship text not null default 'parent',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(parent_profile_id, student_id)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  grade_level text,
  teacher_id uuid references public.teachers(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_period_id uuid not null references public.academic_periods(id) on delete cascade,
  grade_level text not null,
  status text not null check (status in ('active', 'inactive', 'graduated', 'suspended')) default 'active',
  enrollment_date date not null default current_date,
  certificate_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  grade_level text not null,
  day_of_week int not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  classroom text,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present', 'absent', 'justified')),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(student_id, attendance_date)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  academic_period_id uuid not null references public.academic_periods(id) on delete cascade,
  grade_value numeric(4,2) not null,
  grade_letter text,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(student_id, subject_id, academic_period_id)
);

create table if not exists public.disciplinary_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  record_date date not null default current_date,
  severity text not null,
  description text not null,
  responsible_id uuid not null references public.profiles(id) on delete restrict,
  notified_parent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  report_type text not null,
  file_url text not null,
  generated_by uuid not null references public.profiles(id) on delete restrict,
  generated_at timestamptz not null default now()
);

create index if not exists idx_students_student_code on public.students(student_code);
create index if not exists idx_teachers_teacher_code on public.teachers(teacher_code);
create index if not exists idx_subjects_code on public.subjects(code);
create index if not exists idx_attendance_student_date on public.attendance(student_id, attendance_date);
create index if not exists idx_grades_student_subject on public.grades(student_id, subject_id);
create index if not exists idx_disciplinary_student on public.disciplinary_records(student_id, record_date);

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.parent_student_relationships enable row level security;
alter table public.subjects enable row level security;
alter table public.academic_periods enable row level security;
alter table public.enrollments enable row level security;
alter table public.schedules enable row level security;
alter table public.attendance enable row level security;
alter table public.grades enable row level security;
alter table public.disciplinary_records enable row level security;
alter table public.generated_reports enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

-- Sin esta política, el alta de un usuario nuevo no puede crear su propio
-- perfil: en ese momento is_admin() todavía es falso porque el perfil no
-- existe, así que "profiles_manage_admins" no aplica. La restricción real de
-- qué rol puede autoasignarse queda del lado del cliente (ver lib/auth.ts);
-- aquí solo se garantiza que cada usuario únicamente pueda crear su propia fila.
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create function public.is_admin() returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- `is_admin()` cubre solo el rol admin; la mayoría de tablas académicas las
-- gestionan admin y coordinador por igual, así que se generaliza en dos
-- funciones más para no repetir el mismo `exists (...)` en cada política.
create function public.has_role(required_role text) returns boolean
language sql stable security definer
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = required_role
  );
$$;

create function public.is_staff() returns boolean
language sql stable security definer
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'admin',
        'coordinator',
        'teacher'
      )
  );
$$;

create policy "profiles_manage_admins" on public.profiles
for all using (public.is_admin());

create policy "students_select_allowed" on public.students
for select using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.parent_student_relationships psr
    where psr.student_id = students.id and psr.parent_profile_id = auth.uid() and psr.active = true
  )
  or public.is_staff()
);

create policy "students_manage_admin_or_coordinator" on public.students
for all using (public.is_admin() or public.has_role('coordinator'))
with check (public.is_admin() or public.has_role('coordinator'));

-- El directorio de docentes no es sensible: cualquier usuario autenticado
-- puede consultarlo (lo necesitan asignaturas, horarios y las vistas de
-- estudiantes/padres). Solo admin y coordinador lo editan.
create policy "teachers_select_authenticated" on public.teachers
for select using (true);

create policy "teachers_manage_admin_or_coordinator" on public.teachers
for all using (public.is_admin() or public.has_role('coordinator'))
with check (public.is_admin() or public.has_role('coordinator'));

create policy "subjects_select_authenticated" on public.subjects
for select using (true);

create policy "subjects_manage_admin_or_coordinator" on public.subjects
for all using (public.is_admin() or public.has_role('coordinator'))
with check (public.is_admin() or public.has_role('coordinator'));

create policy "academic_periods_select_authenticated" on public.academic_periods
for select using (true);

create policy "academic_periods_manage_admin_or_coordinator" on public.academic_periods
for all using (public.is_admin() or public.has_role('coordinator'))
with check (public.is_admin() or public.has_role('coordinator'));

create policy "schedules_select_authenticated" on public.schedules
for select using (true);

create policy "schedules_manage_admin_or_coordinator" on public.schedules
for all using (public.is_admin() or public.has_role('coordinator'))
with check (public.is_admin() or public.has_role('coordinator'));

create policy "enrollments_select_allowed" on public.enrollments
for select using (
  student_id in (
    select id from public.students where profile_id = auth.uid()
  )
  or exists (
    select 1 from public.parent_student_relationships psr
    where psr.student_id = enrollments.student_id and psr.parent_profile_id = auth.uid() and psr.active = true
  )
  or public.is_staff()
);

create policy "enrollments_manage_admin_or_coordinator" on public.enrollments
for all using (public.is_admin() or public.has_role('coordinator'))
with check (public.is_admin() or public.has_role('coordinator'));

create policy "parent_relationships_select_own" on public.parent_student_relationships
for select using (parent_profile_id = auth.uid());

create policy "parent_relationships_manage_admin" on public.parent_student_relationships
for all using (public.is_admin() or public.has_role('coordinator'))
with check (public.is_admin() or public.has_role('coordinator'));

create policy "grades_select_allowed" on public.grades
for select using (
  student_id in (
    select id from public.students where profile_id = auth.uid()
  )
  or exists (
    select 1 from public.parent_student_relationships psr
    join public.students s on s.id = psr.student_id
    where psr.student_id = grades.student_id and psr.parent_profile_id = auth.uid() and psr.active = true
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'coordinator', 'teacher')
  )
);

create policy "grades_manage_teacher_or_admin" on public.grades
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'teacher')
  )
);

create policy "attendance_select_allowed" on public.attendance
for select using (
  student_id in (
    select id from public.students where profile_id = auth.uid()
  )
  or exists (
    select 1 from public.parent_student_relationships psr
    join public.students s on s.id = psr.student_id
    where psr.student_id = attendance.student_id and psr.parent_profile_id = auth.uid() and psr.active = true
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'coordinator', 'teacher')
  )
);

create policy "attendance_manage_teacher_or_admin" on public.attendance
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'teacher')
  )
);
