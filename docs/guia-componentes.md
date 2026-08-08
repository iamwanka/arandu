# Guía de componentes base

Esta guía describe las piezas reutilizables que deja el Sprint 0 y cómo
usarlas al construir un módulo nuevo (estudiantes, docentes, matrícula, etc.).
El objetivo es que cada sprint siguiente reutilice esto en vez de reinventar
tablas, formularios o manejo de estados de carga.

## 1. Capas del proyecto

```
src/
  types.ts              Modelos de dominio (camelCase) que consumen las vistas
  lib/
    database.types.ts   Contrato de las tablas de Supabase (snake_case)
    mappers.ts           Traducción Row <-> modelo de dominio
    supabase.ts          Cliente tipado + requireSupabase()
    errors.ts            AppError y traducción de errores al español
    roles.ts             Roles, permisos y helpers (hasPermission, getRoleLabel)
    validation.ts        Validadores de formulario reutilizables
  services/               Un archivo por entidad, construido sobre createResourceService
  hooks/
    useAsyncData.ts       Lectura (listas, detalle)
    useAsyncAction.ts     Escritura (crear, editar, eliminar, login)
    useLocalStorage.ts    Preferencias de interfaz persistidas (tamaño de página, columnas…)
  components/ui/          Componentes de interfaz reutilizables
  routes/
    appRoutes.ts          Registro único de rutas, permisos y navegación
    useAppRouter.ts        Navegación sobre la History API
    RoleProtectedRoute.tsx Guarda de acceso por rol
```

Regla general: **una vista nueva no debería llamar a `supabase` directamente**.
Pasa siempre por un servicio (`src/services`), y ese servicio es el único que
conoce la forma de las tablas.

## 2. Agregar un módulo nuevo (ej. estudiantes)

1. **Modelo de dominio** — ya existe en `types.ts` (`Student`, `StudentInput`).
   Si el módulo es nuevo, agrégalo ahí siguiendo el mismo patrón
   (`Model`, `ModelInput`, `ModelPatch`).
2. **Servicio** — la mayoría de entidades solo necesitan la fábrica genérica:

   ```ts
   // src/services/students.ts
   export const studentsService = createResourceService<'students', Student, StudentInput>({
       table: 'students',
       label: 'estudiante',
       toModel: toStudent,
       toRow: fromStudent,
       searchColumns: ['full_name', 'student_code', 'grade_level'],
       defaultOrderBy: 'full_name',
       defaultAscending: true,
   });
   ```

   Da `list`, `listPaged`, `getById`, `create`, `update` y `remove` gratis, todos
   tipados y con errores ya traducidos. Si la entidad necesita una consulta
   propia (por ejemplo `hasActiveEnrollment`), agrégala como función suelta en
   el mismo archivo (ver `services/enrollments.ts`).

3. **Ruta** — agrega una entrada en `routes/appRoutes.ts` con `status: 'ready'`
   y los roles permitidos. Cambia `status` de `'planned'` a `'ready'` si ya
   existía como placeholder.
4. **Vista** — regístrala en el mapa `VIEWS` de
   `features/dashboard/views/DashboardMain.tsx`.

## 3. Componentes de `components/ui`

| Componente | Uso |
| --- | --- |
| `DataTable` | Listados. Envuelve `Table` de Cloudscape con contador, buscador y estado vacío ya resueltos. |
| `FormPanel` | Formularios. Maneja el envío, el estado de guardado y el feedback de error/éxito. |
| `FeedbackAlert` | Alertas de error/éxito/info. Úsalo siempre que muestres el `error`/`success` de un hook. |
| `EmptyState` | Estado vacío de una tabla o sección. `DataTable` ya lo usa internamente. |
| `LoadingState` | Spinner de sección o pantalla completa. |
| `SectionCard` | Contenedor estándar con `Header` + `SpaceBetween`, para cualquier bloque de contenido. |
| `ProfileSelect` | Selector de una cuenta existente por rol (`role="student"`, `"teacher"`, `"parent"`…), con exclusión de perfiles ya vinculados. Ver sección 3bis. |

### 3bis. Vincular un registro a una cuenta existente (`ProfileSelect`)

`students.profile_id` y `teachers.profile_id` son obligatorios en el esquema:
un estudiante o docente **siempre** corresponde a una cuenta ya registrada con
ese rol (asignado desde "Usuarios y roles"). `ProfileSelect` es el punto único
donde se elige esa cuenta al crear el registro:

```tsx
const [profileId, setProfileId] = useState<string | null>(null);

<ProfileSelect
    role="student"
    excludeProfileIds={students.map((s) => s.profileId)} // ya vinculados
    value={profileId}
    onChange={(id, profile) => {
        setProfileId(id);
        if (profile) setForm((f) => ({ ...f, fullName: f.fullName || profile.name }));
    }}
/>
```

`onChange` entrega también el `AppUser` completo (no solo el id) para poder
precargar campos del formulario sin volver a consultar. En edición no se
vuelve a mostrar el selector: el vínculo con la cuenta no cambia después de
creado (ver `StudentFormModal`/`TeacherFormModal`).

Si el selector aparece vacío, el mensaje guía a asignar el rol primero en
Usuarios y roles — es el flujo esperado, no un error.

### 3ter. Formularios dentro de un `Modal`

`FormPanel` acepta `title` opcional: cuando el formulario vive dentro de un
`Modal` de Cloudscape (que ya trae su propio encabezado), omite `title` para
no duplicarlo:

```tsx
<Modal visible onDismiss={onDismiss} header="Nuevo estudiante">
    <FormPanel onSubmit={handleSubmit} onCancel={onDismiss} submitting={save.pending} error={save.error}>
        {/* FormField(s) */}
    </FormPanel>
</Modal>
```

Para que el formulario arranque limpio en cada apertura (sin arrastrar estado
de una edición anterior), el llamador renderiza el modal condicionalmente con
una `key` distinta por registro, en vez de alternar solo un prop `visible`:

```tsx
{modal ? (
    <StudentFormModal key={modal.mode === 'edit' ? modal.student.id : 'new'} ... />
) : null}
```

### Ejemplo: listado con búsqueda

```tsx
const [search, setSearch] = useState('');
const { data, loading, error, reload } = useAsyncData(
    () => studentsService.list({ search }),
    [search],
);

<FeedbackAlert error={error} onRetry={reload} />
<DataTable
    title="Estudiantes"
    trackBy="id"
    items={data ?? []}
    loading={loading}
    search={{ value: search, onChange: setSearch }}
    columns={[
        { id: 'name', header: 'Nombre', cell: (s) => s.fullName },
        { id: 'grade', header: 'Grado', cell: (s) => s.gradeLevel },
    ]}
/>
```

### Ejemplo: formulario de creación

```tsx
const [form, setForm] = useState<StudentInput>(emptyStudent);
const errors = validateFields(form, { fullName: required('El nombre') });

const save = useAsyncAction(studentsService.create, {
    successMessage: 'Estudiante creado.',
    onSuccess: () => { reload(); onClose(); },
});

<FormPanel
    title="Nuevo estudiante"
    onSubmit={() => !hasErrors(errors) && save.run(form)}
    submitting={save.pending}
    error={save.error}
    success={save.success}
>
    <FormField label="Nombre completo" errorText={errors.fullName}>
        <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.detail.value })} />
    </FormField>
</FormPanel>
```

## 4. Hooks

- **`useAsyncData(fetcher, deps)`** — para cualquier lectura. Cancela
  respuestas obsoletas (p. ej. si el usuario cambia el filtro de búsqueda
  antes de que responda la petición anterior) y expone `reload` y `setData`
  para actualizaciones optimistas.
- **`useAsyncAction(action, options)`** — para cualquier escritura. Expone
  `run`, `pending`, `error`, `success` y `reset`. `options.onSuccess` es el
  lugar natural para recargar una lista o cerrar un modal.
- **`useLocalStorage(key, defaultValue)`** — `[value, setValue, reset]`
  persistido en `localStorage`. Es solo para preferencias de interfaz (tamaño
  de página, columnas visibles), nunca para datos de negocio.

Ninguno de los dos primeros necesita `try/catch` en la vista: los errores ya
llegan traducidos vía `lib/errors.ts`.

## 4bis. Tablas con filtro, orden y paginación (`useCollection`)

`DataTable` no filtra ni ordena por sí solo: para listados que lo necesiten,
usa `useCollection` de `@cloudscape-design/collection-hooks` (el mismo patrón
que usan los demos oficiales de Cloudscape) y conecta su salida a los props
`filter`, `preferences`, `sortingColumn`/`sortingDescending`/`onSortingChange`,
`pagination` y `empty` de `DataTable`. Ejemplo completo en
`features/admin/AdminRolesPanel.tsx`:

```tsx
const [pageSize, setPageSize] = useLocalStorage('arandu-students-page-size', 10);

const { items, collectionProps, filterProps, paginationProps, filteredItemsCount, actions } = useCollection(
    students,
    {
        filtering: {
            filteringFunction: (item, text) => item.fullName.toLowerCase().includes(text.toLowerCase()),
            empty: <EmptyState title="Sin estudiantes" description="..." />,
        },
        pagination: { pageSize },
        sorting: { defaultState: { sortingColumn: columns[0] } },
    },
);

// "sin resultados del filtro" se calcula aparte de `empty`: referenciar
// `actions` dentro de la misma llamada a useCollection que lo devuelve
// crea una dependencia circular que el linter de este proyecto rechaza.
const emptyState =
    filterProps.filteringText && items.length === 0
        ? <EmptyState title="Sin resultados" action={<Button onClick={() => actions.setFiltering('')}>Limpiar filtro</Button>} />
        : collectionProps.empty;

<DataTable
    title="Estudiantes"
    trackBy="id"
    items={items}
    totalCount={filteredItemsCount}
    filter={<TextFilter {...filterProps} />}
    preferences={<CollectionPreferences preferences={{ pageSize }} onConfirm={({ detail }) => setPageSize(detail.pageSize ?? 10)} pageSizePreference={{ options: [...] }} />}
    sortingColumn={collectionProps.sortingColumn}
    sortingDescending={collectionProps.sortingDescending}
    onSortingChange={collectionProps.onSortingChange}
    empty={emptyState}
    pagination={<Pagination {...paginationProps} />}
    columns={columns}
/>
```

Esto es filtrado/orden **en cliente**: bueno para listas de hasta unos
cientos de filas (usuarios, docentes, asignaturas). Para tablas que puedan
crecer mucho más (matrículas, calificaciones), usa `listPaged` del servicio
(paginación en servidor) en vez de `useCollection`.

## 5. Roles y permisos

- `lib/roles.ts` es la única fuente de la matriz de permisos. No repitas
  `if (role === 'admin' || role === 'coordinator')` en las vistas: usa
  `hasPermission(role, 'manage-students')`.
- `routes/appRoutes.ts` decide qué ve cada rol en la navegación. El panel de
  **Seguridad** (`/dashboard/security`) muestra esa misma matriz en pantalla,
  así que un cambio en `appRoutes.ts` o `roles.ts` se refleja ahí sin trabajo
  extra.
- Este control es solo de interfaz. La autorización real la aplican las
  políticas RLS de `supabase/schema.sql`; toda tabla nueva necesita sus propias
  políticas antes de exponerse en un servicio.

## 6. Errores

Todos los servicios lanzan `AppError` (`lib/errors.ts`). Los hooks ya la
capturan y la convierten en un string en español. Si necesitas distinguir el
tipo de error (por ejemplo, para deshabilitar un botón en `conflict`), usa
`toAppError(error).kind`.

## 7. Estado de cuenta y sesión bloqueada

`profiles.active` controla si una cuenta puede usar la aplicación. El patrón
completo, si otro módulo necesita algo similar ("suspender" una matrícula,
por ejemplo):

- El servicio expone una función de escritura dedicada
  (`services/profiles.ts#updateProfileActive`), no un `update` genérico desde
  la vista.
- `lib/auth.ts#buildAppSession` es el único lugar que decide si una sesión es
  válida. Si el perfil existe pero `active` es `false`, cierra la sesión de
  Supabase (`auth.signOut()`) y lanza `new AppError('account-disabled', ...)`
  en vez de devolver `null`: así se distingue "no hay sesión" de "había una
  sesión y se bloqueó", y el mensaje específico llega hasta la interfaz.
- `AuthContext` expone `blockedMessage` además de `session`/`loading`, seteado
  cuando `getCurrentSession()` o `subscribeToAuthChanges()` capturan ese error
  puntual (`toAppError(error).kind === 'account-disabled'`). `App.tsx` lo
  muestra como alerta en la landing. Un intento de login con una cuenta
  desactivada no necesita este mecanismo: el error ya llega por el flujo
  normal de `useAsyncAction` en `AuthPanel`.
- La UI de administración (`AdminRolesPanel`) impide desactivar o cambiar el
  rol del **último administrador activo** — es una guarda de cliente para
  evitar dejar la plataforma sin administradores, documentada como tal porque
  RLS (`profiles_manage_admins`, `for all`) no la aplica a nivel de base de
  datos. Si esa regla se vuelve crítica, hay que moverla a un trigger de
  Postgres.

## 8. Pendiente para módulos futuros

- No hay componente de formulario paso a paso (wizard); el flujo de matrícula
  del Sprint 3 lo va a necesitar y debería añadirse a `components/ui`.
- La guarda de "último administrador" es solo de interfaz (ver sección 7);
  si se necesita como regla dura, hace falta un trigger en `supabase/schema.sql`.
- Recuperación de contraseña (`resetPasswordForEmail`) no está implementada:
  quedó fuera del Sprint 1 porque requiere configurar la plantilla de correo
  en el dashboard de Supabase, no solo código.
