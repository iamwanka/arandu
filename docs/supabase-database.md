# Documentación de base de datos en Supabase

Este documento define el esquema base recomendado para Arandu en Supabase,
alineado con los roles del proyecto y con la arquitectura actual del frontend.

## 1. Objetivo

Preparar una base de datos PostgreSQL en Supabase que soporte:

- autenticación de usuarios con Supabase Auth;
- roles y permisos de acceso;
- gestión de estudiantes, docentes, padres y materias;
- matrícula, calificaciones, asistencia y reportes;
- políticas de seguridad con Row Level Security (RLS).

## 2. Estructura propuesta

El esquema usa el siguiente modelo de datos:

- `profiles`: perfil de usuario vinculado a `auth.users`.
- `students`: información de estudiantes.
- `teachers`: información de docentes.
- `parent_student_relationships`: relación entre padres y estudiantes.
- `subjects`: asignaturas del plan académico.
- `academic_periods`: periodos escolares.
- `enrollments`: matrículas por estudiante y periodo.
- `schedules`: horarios por grado, día y materia.
- `attendance`: registros de asistencia.
- `grades`: calificaciones registradas por docente.
- `disciplinary_records`: incidencias disciplinarias.
- `generated_reports`: reportes y boletines generados.

## 3. Tablas y campos

### 3.1 profiles

| Columna      | Tipo          | Descripción                                                              |
| ------------ | ------------- | ------------------------------------------------------------------------ |
| `id`         | `uuid`        | Identificador del usuario. Referencia a `auth.users.id`.                 |
| `role`       | `text`        | Rol del usuario: `admin`, `coordinator`, `teacher`, `student`, `parent`. |
| `full_name`  | `text`        | Nombre completo.                                                         |
| `email`      | `text`        | Correo principal.                                                        |
| `phone`      | `text`        | Teléfono de contacto.                                                    |
| `created_at` | `timestamptz` | Fecha de creación.                                                       |

### 3.2 students

| Columna        | Tipo          | Descripción                    |
| -------------- | ------------- | ------------------------------ |
| `id`           | `uuid`        | Identificador del estudiante.  |
| `profile_id`   | `uuid`        | Referencia a `profiles.id`.    |
| `student_code` | `text`        | Código interno del estudiante. |
| `full_name`    | `text`        | Nombre completo.               |
| `birth_date`   | `date`        | Fecha de nacimiento.           |
| `grade_level`  | `text`        | Grado actual.                  |
| `address`      | `text`        | Dirección.                     |
| `phone`        | `text`        | Teléfono contacto.             |
| `created_at`   | `timestamptz` | Fecha de registro.             |

### 3.3 teachers

| Columna        | Tipo      | Descripción                 |
| -------------- | --------- | --------------------------- |
| `id`           | `uuid`    | Identificador titular.      |
| `profile_id`   | `uuid`    | Referencia a `profiles.id`. |
| `teacher_code` | `text`    | Código del docente.         |
| `full_name`    | `text`    | Nombre completo.            |
| `specialty`    | `text`    | Especialidad.               |
| `email`        | `text`    | Correo institucional.       |
| `phone`        | `text`    | Teléfono.                   |
| `active`       | `boolean` | Estado del docente.         |

### 3.4 parent_student_relationships

| Columna             | Tipo      | Descripción                   |
| ------------------- | --------- | ----------------------------- |
| `id`                | `uuid`    | Identificador de la relación. |
| `parent_profile_id` | `uuid`    | Perfil del padre o acudiente. |
| `student_id`        | `uuid`    | Estudiante asociado.          |
| `relationship`      | `text`    | Tipo de vínculo.              |
| `active`            | `boolean` | Relación vigente.             |

### 3.5 subjects

| Columna       | Tipo      | Descripción              |
| ------------- | --------- | ------------------------ |
| `id`          | `uuid`    | Identificador.           |
| `code`        | `text`    | Código de la asignatura. |
| `name`        | `text`    | Nombre de la asignatura. |
| `grade_level` | `text`    | Grado donde se ofrece.   |
| `teacher_id`  | `uuid`    | Docente responsable.     |
| `active`      | `boolean` | Estado activo.           |

### 3.6 academic_periods

| Columna      | Tipo      | Descripción                               |
| ------------ | --------- | ----------------------------------------- |
| `id`         | `uuid`    | Identificador.                            |
| `name`       | `text`    | Nombre del periodo, por ejemplo `2026-1`. |
| `start_date` | `date`    | Fecha inicio.                             |
| `end_date`   | `date`    | Fecha fin.                                |
| `is_active`  | `boolean` | Periodo vigente.                          |

### 3.7 enrollments

| Columna              | Tipo   | Descripción                                     |
| -------------------- | ------ | ----------------------------------------------- |
| `id`                 | `uuid` | Identificador.                                  |
| `student_id`         | `uuid` | Estudiante.                                     |
| `academic_period_id` | `uuid` | Periodo escolar.                                |
| `grade_level`        | `text` | Grado matriculado.                              |
| `status`             | `text` | `active`, `inactive`, `graduated`, `suspended`. |
| `enrollment_date`    | `date` | Fecha de matrícula.                             |
| `certificate_url`    | `text` | URL del comprobante.                            |

### 3.8 schedules

| Columna       | Tipo   | Descripción             |
| ------------- | ------ | ----------------------- |
| `id`          | `uuid` | Identificador.          |
| `grade_level` | `text` | Grado.                  |
| `day_of_week` | `int`  | Día de la semana (1-7). |
| `start_time`  | `time` | Hora inicio.            |
| `end_time`    | `time` | Hora fin.               |
| `subject_id`  | `uuid` | Asignatura.             |
| `teacher_id`  | `uuid` | Docente responsable.    |
| `classroom`   | `text` | Aula asignada.          |

### 3.9 attendance

| Columna           | Tipo          | Descripción                       |
| ----------------- | ------------- | --------------------------------- |
| `id`              | `uuid`        | Identificador.                    |
| `student_id`      | `uuid`        | Estudiante.                       |
| `attendance_date` | `date`        | Fecha.                            |
| `status`          | `text`        | `present`, `absent`, `justified`. |
| `recorded_by`     | `uuid`        | Perfil del docente que registró.  |
| `created_at`      | `timestamptz` | Fecha del registro.               |

### 3.10 grades

| Columna              | Tipo          | Descripción                   |
| -------------------- | ------------- | ----------------------------- |
| `id`                 | `uuid`        | Identificador.                |
| `student_id`         | `uuid`        | Estudiante.                   |
| `subject_id`         | `uuid`        | Asignatura.                   |
| `academic_period_id` | `uuid`        | Periodo.                      |
| `grade_value`        | `numeric`     | Nota numérica.                |
| `grade_letter`       | `text`        | Nota literal.                 |
| `recorded_by`        | `uuid`        | Docente que registró la nota. |
| `created_at`         | `timestamptz` | Fecha de registro.            |

### 3.11 disciplinary_records

| Columna           | Tipo      | Descripción                     |
| ----------------- | --------- | ------------------------------- |
| `id`              | `uuid`    | Identificador.                  |
| `student_id`      | `uuid`    | Estudiante.                     |
| `record_date`     | `date`    | Fecha del incidente.            |
| `severity`        | `text`    | Nivel de severidad.             |
| `description`     | `text`    | Descripción.                    |
| `responsible_id`  | `uuid`    | Usuario responsable.            |
| `notified_parent` | `boolean` | Indica si se notificó al padre. |

### 3.12 generated_reports

| Columna        | Tipo          | Descripción                    |
| -------------- | ------------- | ------------------------------ |
| `id`           | `uuid`        | Identificador.                 |
| `student_id`   | `uuid`        | Estudiante relacionado.        |
| `report_type`  | `text`        | Tipo de reporte.               |
| `generated_at` | `timestamptz` | Fecha de generación.           |
| `file_url`     | `text`        | URL del archivo en Storage.    |
| `generated_by` | `uuid`        | Usuario que generó el reporte. |

## 4. Índices recomendados

Se recomienda crear índices sobre:

- `students.student_code`
- `teachers.teacher_code`
- `subjects.code`
- `attendance.student_id`
- `attendance.attendance_date`
- `grades.student_id`
- `grades.subject_id`
- `disciplinary_records.student_id`

## 5. Seguridad con RLS

Las políticas base pueden definirse así:

- `profiles`: el usuario solo ve su propio perfil; los administradores pueden
  gestionar todo.
- `students`: el estudiante ve su propio registro; los padres ven los
  estudiantes asociados; docentes y coordinadores ven los estudiantes del
  colegio; los administradores pueden gestionar todo.
- `grades`, `attendance` y `disciplinary_records`: los docentes registran datos
  de sus asignaturas o grupos; los estudiantes y padres ven solo su información.

## 6. Pasos de implementación en Supabase

1. Crear un proyecto en Supabase.
2. Abrir el SQL Editor.
3. Ejecutar el script en [supabase/schema.sql](../supabase/schema.sql).
4. Configurar las variables de entorno en Vercel o en el entorno local.
5. Crear el primer usuario en Supabase Auth.
6. Insertar un perfil inicial con rol `admin`.
7. Probar las políticas de RLS desde la app.

## 7. Perfiles iniciales con roles autorizados

| Rol        | Email          | Contraseña                    | Nombre |
| -------------- | ------------- | ------------------------------ | ----------- |
| `admin`       | `ana.rodriguez@colegio.edu`         | 123456 | 'Ana Rodríguez'|
| `coordinador` | `luis.martinez@colegio.edu`         | 123456 | 'Luis Martínez'|
| `profesor`    | `maria.garcia@colegio.edu`          | 123456 | 'María García' |
| `profesor`    | `carlos.perez@colegio.edu`          | 123456 | 'Carlos Pérez' |
| `estudiante`  | `sofia.torres@student.colegio.edu`  | 123456 | 'Sofía Torres' |
| `estudiante`  | `diego.jimenez@student.colegio.edu` | 123456 | 'Diego Jiménez'|
| `parent`      | `elena.torres@familia.colegio.edu`  | 123456 | 'Elena Torres' |
| `parent`      | `raul.jimenez@familia.colegio.edu`  | 123456 | 'Raúl Jiménez' |



## 8. Siguientes pasos

- conectar la UI con las tablas reales en lugar del modo demo;
- crear migraciones con Supabase CLI;
- añadir almacenamiento para reportes y boletines;
- preparar triggers para notificaciones y auditoría.
