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
| `TeacherSelect` | Selector de un docente activo (por `teachers.id`, no por cuenta). Úsalo para "docente responsable" en asignaturas u horarios. |
| `StudentSelect` | Selector de un estudiante registrado, con búsqueda. Usado por el wizard de matrícula. |

`SubjectSelect` y `AcademicPeriodSelect` siguen el mismo patrón pero viven en
`features/academic/` (no en `components/ui`) porque hoy solo los usa ese
módulo; si otro módulo los necesita, muévelos a `components/ui` igual que se
hizo con `TeacherSelect`/`StudentSelect`.

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

`TeacherSelect` y `StudentSelect` siguen el mismo patrón que `ProfileSelect`
(cargan su propia lista con `useAsyncData`, devuelven el registro completo en
`onChange`) pero apuntan a `teachers`/`students` en vez de `profiles` — úsalos
cuando el campo a llenar es "elige un docente/estudiante ya registrado", no
"vincula una cuenta". Si aparece un cuarto caso (p. ej. un selector de
asignaturas para horarios en el Sprint 5), vale la pena generalizarlos en un
solo componente parametrizado por servicio en vez de seguir copiando el
archivo.

### 3quater. Flujo de varios pasos (`Wizard`)

Para un proceso que se completa en pasos secuenciales (como la matrícula), usa
el `Wizard` de Cloudscape directamente — no hace falta un componente propio en
`components/ui`, solo el patrón de validación por paso. Ver
`features/academic/EnrollmentWizard.tsx`:

```tsx
const handleNavigate = ({ detail }: { detail: WizardProps.NavigateDetail }) => {
    if (detail.reason === 'next' && activeStepIndex === 0 && !studentId) {
        setStepError('Selecciona un estudiante para continuar.');
        return; // no avanza: se queda en el paso actual
    }
    setStepError(null);
    setActiveStepIndex(detail.requestedStepIndex);
};

<Wizard
    i18nStrings={WIZARD_I18N} // textos de los botones, obligatorio
    activeStepIndex={activeStepIndex}
    onNavigate={handleNavigate}
    onCancel={onDismiss}
    onSubmit={() => void create.run()} // se dispara en el botón del último paso
    isLoadingNextStep={create.pending}
    steps={[{ title: 'Estudiante', content: <StudentSelect ... /> }, /* ... */]}
/>
```

Puntos clave:
- La validación bloquea el avance devolviéndose sin llamar
  `setActiveStepIndex`; no hay `errorText` a nivel de paso, así que el error
  se muestra dentro del `content` del paso activo (`FormField errorText={activeStepIndex === N ? stepError : undefined}`).
- Las reglas de negocio asíncronas (como "¿ya existe una matrícula activa?")
  se resuelven con `useAsyncData` reaccionando a los campos relevantes, y se
  consultan dentro de `handleNavigate` antes de dejar pasar al siguiente paso.
- El wizard reemplaza el contenido de la pestaña/panel mientras está abierto
  (no vive en un `Modal`): con tres o más pasos y varios campos por paso, un
  modal se queda corto.

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

### 4quinquies. Planillas de registro por lote (calificaciones, asistencia)

Cuando la operación real es "un docente llena una columna para todo un curso y
guarda de una vez" (no un CRUD fila por fila), el patrón es distinto al de
`useCollection`: no hace falta ordenar/paginar/filtrar, sino una tabla
100% editable con un solo botón de guardado. Ver
`features/progress/GradeEntryPanel.tsx` / `AttendanceEntryPanel.tsx`:

1. **Filtros que definen el universo**: dos `Select` (asignatura + periodo, o
   periodo + fecha) que arman el "roster" — la lista de estudiantes con
   matrícula activa en ese periodo (`enrollmentsService.list()` filtrado en
   cliente, cruzado con `studentsService.list()`).
2. **Precarga**: al resolver el roster, se consulta lo ya guardado (`listGradesForSubjectPeriod`,
   `listAttendanceForDate`) y se llena un `Record<studentId, RowState>` en
   estado local — así reabrir la planilla muestra lo existente, no la deja en
   blanco.
3. **Edición**: cada celda es un `Input`/`SegmentedControl` normal que escribe
   directo al `Record` por `studentId`. No hay guardado por fila.
4. **Guardado por lote**: un único botón arma un arreglo de `*Input[]` a partir
   del `Record` y llama a un `upsert*` del servicio (`upsertGrades`,
   `upsertAttendance`) que hace **un solo** `supabase.from(...).upsert(rows, {onConflict: '...'})`
   — no `Promise.all` de escrituras individuales. La clave de conflicto es la
   restricción única de la tabla (`student_id,subject_id,academic_period_id`
   para notas; `student_id,attendance_date` para asistencia), así que volver a
   guardar corrige el valor en vez de duplicar la fila.

Esto evita reimplementar `createResourceService` para algo que no es un CRUD
por id: el servicio expone `upsertX(inputs: XInput[])`, no `create`/`update`.

### 4sexies. Una ruta, contenido distinto según el rol

`/dashboard/progress` es una sola entrada en `appRoutes.ts` (roles: staff +
`student` + `parent`) pero muestra cosas completamente distintas: el personal
ve herramientas de *registro*, el estudiante/padre ve una *consulta* de solo
lectura. El patrón (`features/progress/ProgressPanel.tsx`) es un `if` simple
sobre `session.user.role` al principio del componente de la ruta, no dos rutas
separadas ni lógica condicional repartida en los componentes hijos:

```tsx
export default function ProgressPanel({ session }: { session: AppSession }) {
    if (session.user.role === 'student' || session.user.role === 'parent') {
        return <MyProgressView session={session} />;
    }
    return <Tabs tabs={[...]} />; // herramientas de registro para staff
}
```

Úsalo cuando la sección es conceptualmente "una" (mismo ítem de navegación,
mismo propósito general) pero la interacción difiere tanto por rol que
mezclarla en una sola vista con `hasPermission()` por aquí y por allá sería
más confuso que dos componentes separados con un punto de entrada común.

Para una vista de solo-lectura scopeada al usuario (como `MyProgressView`),
aprovecha que RLS ya filtra: `studentsService.list()` devuelve solo el propio
registro para un estudiante, o los hijos vinculados y activos para un padre —
no hace falta ninguna consulta especial por rol, solo iterar lo que llega.

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

## 7bis. Comprobantes en PDF y estados sin equivalente directo

- `lib/pdf.ts#generateEnrollmentReceiptPdf` genera el PDF **en el navegador**
  con jsPDF y lo descarga; no sube nada a Supabase Storage. `enrollments.certificate_url`
  queda `null` a propósito — es la misma decisión que en Sprint 3, sin cambios.
  El Sprint 6 sí sube a Storage, pero solo para `generated_reports` (ver 7quater):
  son dos necesidades distintas (comprobante desechable vs. historial consultable).
- `enrollments.status` en el esquema solo admite
  `active | inactive | graduated | suspended` (no existe un valor "pendiente"
  propio). `EnrollmentsPanel` usa `inactive` para representar "pendiente o
  retirada antes de iniciar" — es una decisión de mapeo en la capa de
  interfaz, no algo que cambie el `check` de la base de datos.

## 7ter. Horarios y disciplina

- `hasScheduleConflict` (`services/schedules.ts`) valida en la aplicación que
  un docente o un aula no tengan dos clases superpuestas el mismo día — no hay
  `exclusion constraint` en Postgres para esto. Se llama **antes** del
  `create`/`update`, no dentro (a diferencia del wizard de matrícula, donde el
  chequeo de duplicados vive en `useAsyncData`): aquí el conflicto se conoce
  recién al enviar el formulario, así que se resuelve en `handleSubmit` con un
  estado `checkingConflict` propio en vez de forzarlo dentro de `useAsyncAction`.
- "Horarios" (`/dashboard/schedules`) es visible a **todos** los roles (todos
  necesitan consultar el horario) pero solo admin/coordinador ven los botones
  de crear/editar — un tercer caso del patrón de la sección 4sexies
  (`hasPermission(session.user.role, 'manage-schedules')` controla qué
  columnas/acciones se agregan a la tabla, no qué ve la ruta).
- "Disciplina" no tiene ruta propia: vive como una pestaña más dentro de
  `ProgressPanel` (staff) y una tabla más dentro de `MyProgressView`
  (estudiante/padre) — se agregó al mismo lugar que notas y asistencia porque
  conceptualmente es lo mismo ("seguimiento de este estudiante"), no un tercer
  ítem de navegación nuevo.

## 7quater. Reportes generados y Storage

- `generated_reports` (con RLS activado y **cero políticas** hasta el Sprint 6 —
  mismo bug recurrente que `teachers` y `disciplinary_records`) necesitaba una
  decisión de diseño antes de construir el módulo: `file_url text not null` ya
  scaffoldeaba la intención de subir el PDF a Storage, a diferencia del
  comprobante de matrícula (7bis). Se optó por subirlo de verdad — el
  historial de reportes debe poder redescargar el documento exacto que se
  generó, no solo sus datos.
- Bucket **privado** `reports` (no público). `services/reports.ts#generateReport`
  sube el blob con `storage.from('reports').upload(...)` y en la misma llamada
  inserta la fila de `generated_reports`, generando el `id` en el cliente
  (`crypto.randomUUID()`) porque hace falta *antes* de subir el archivo, para
  usarlo como nombre de la ruta. `fileUrl` guarda esa ruta relativa
  (`{studentId|institutional}/{id}.pdf`), no una URL pública — el bucket es
  privado, así que descargar pasa siempre por `downloadReportFile` (URL firmada
  implícita vía el cliente autenticado), nunca por un link directo.
- Autorización de la ruta de Storage: el primer segmento de la ruta es el
  `student_id` (o el literal `institutional`). La política
  `reports_bucket_select_allowed` compara ese segmento
  (`storage.foldername(name)[1]`) contra los estudiantes propios/hijos del
  usuario — el mismo patrón self/parent/staff que ya usan `grades`/`attendance`,
  aplicado a `storage.objects` en vez de a una tabla de negocio.
- Solo admin/coordinador **generan** reportes (`is_admin() or has_role('coordinator')`,
  no `is_staff()`): la matriz de `docs/funcionalidades-permisos.md` excluye a
  docentes de "Generar reportes", a diferencia de notas/asistencia/disciplina
  donde sí puede escribir cualquier miembro del staff.
- "Reportes" (`/dashboard/reports`) es una ruta nueva, solo para
  admin/coordinador (institucional). Los boletines de un estudiante concreto,
  en cambio, no tienen ruta propia para verlos: aparecen como una tabla más
  dentro de `MyProgressView`, mismo patrón de "no crear un ítem de navegación
  nuevo cuando el dato ya es del estudiante" que Disciplina en 7ter.
- Los reportes institucionales (asistencia/rendimiento por grado) no tienen
  columna propia de filtro en `grades`/`attendance` — se listan **todas** las
  filas del periodo (`listGradesForPeriod`, `listAttendanceForRange`) y se
  agrupan por estudiante en el cliente. Es la misma escala de datos que ya
  asume el resto de la app (sin agregaciones SQL del lado del servidor).

## 8. Pendiente para módulos futuros

- La guarda de "último administrador" es solo de interfaz (ver sección 7);
  si se necesita como regla dura, hace falta un trigger en `supabase/schema.sql`.
- Recuperación de contraseña (`resetPasswordForEmail`) no está implementada:
  quedó fuera del Sprint 1 porque requiere configurar la plantilla de correo
  en el dashboard de Supabase, no solo código.
- La política RLS de `grades`/`attendance` deja editar a **cualquier**
  docente/coordinador/admin, no solo al docente responsable de esa asignatura
  (`subjects.teacher_id`). Es la misma protección por rol que pide el Sprint 4
  ("solo docentes autorizados", es decir, no estudiantes/padres); si además se
  quiere restringir a "el docente asignado a esa asignatura específica", hay
  que sumar un `exists (select 1 from subjects s join teachers t on t.id =
  s.teacher_id where s.id = grades.subject_id and t.profile_id = auth.uid())`
  a la política — no está hecho porque limitaría a un docente sustituto o a
  quien cubre una asignatura ajena, y el alcance del sprint no lo pedía
  explícitamente.
- `attendance` no tiene columna de asignatura/periodo: el registro es "por
  día", no "por clase". Si se necesita asistencia por hora/asignatura más
  adelante, es un cambio de esquema, no solo de la vista.
