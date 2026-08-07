# Sprint 1 - Arquitectura y diseño de autenticación

## Objetivo

Implementar la base del sistema para el Sprint 1 con:

- login y registro de usuarios
- panel de administración de roles
- modelo de RLS básico para futuras tablas protegidas

## Arquitectura propuesta

### 1. Capas de la solución

1. Capa de presentación
   - React + Vite + Cloudscape Design System
   - Componentes reutilizables para formularios, alertas, contenedores y tablas

2. Capa de dominio
   - Servicios de autenticación y roles en [src/lib/auth.ts](../src/lib/auth.ts)
   - Permisos y etiquetas de rol en [src/lib/roles.ts](../src/lib/roles.ts)

3. Capa de features
   - [src/features/auth/AuthPanel.tsx](../src/features/auth/AuthPanel.tsx) para
     login y registro
   - [src/features/admin/AdminRolesPanel.tsx](../src/features/admin/AdminRolesPanel.tsx)
     para administración de roles
   - [src/features/rls/RlsPolicyCard.tsx](../src/features/rls/RlsPolicyCard.tsx)
     para documentar las políticas de acceso

4. Capa de datos
   - Supabase Auth para sesiones
   - Supabase PostgreSQL con Row Level Security
   - Preparada para agregar tablas como profiles, students, teachers,
     enrollments y grades

## Flujo de autenticación

1. El usuario entra a la vista principal.
2. El componente de autenticación recibe credenciales.
3. El servicio de auth valida el acceso con un flujo demo local o con Supabase
   si está configurado.
4. La sesión se guarda en localStorage y queda disponible para el resto de la
   aplicación.

## Modelo de roles

- admin: acceso total y gestión de roles
- coordinator: supervisión académica y gestión de contenido
- teacher: registrar notas y asistencia
- student: ver información propia
- parent: ver información de hijos

## RLS básico recomendado

Para las tablas de negocio se recomienda:

```sql
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can manage profiles"
  on public.profiles for all
  using (auth.jwt() ->> 'role' = 'admin');
```

## Extensibilidad

La estructura actual está preparada para crecer en tres ejes:

- nuevos módulos académicos (matrículas, calificaciones, asistencias)
- nuevas reglas de negocio y permisos por rol
- integración con backend real usando Supabase Database y políticas de seguridad
  más completas

## Siguientes pasos

- conectar Supabase Auth real con variables de entorno
- crear tablas en PostgreSQL y migraciones SQL
- implementar políticas RLS reales por tabla
- integrar vistas protegidas por rol
