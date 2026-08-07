# Plan de Implementación para Arquitectura en la Nube (Vercel + Supabase)

## 1. Introducción

Has definido los requerimientos funcionales, no funcionales y de proyecto con un alto nivel de detalle. El siguiente paso natural es **refinar la estrategia de implementación** para trasladar esos requisitos a una solución técnica concreta, utilizando exclusivamente **herramientas gratuitas** y una arquitectura moderna basada en la nube.

**Objetivo de este documento:**  
Proporcionar un plan de implementación detallado que especifique:

- La arquitectura de alto nivel y la selección tecnológica.
- El diseño de la base de datos en Supabase (PostgreSQL).
- La implementación de la autenticación y control de acceso basado en roles (RLS).
- El mapeo de cada requerimiento funcional a componentes técnicos (tablas, funciones, Edge Functions, etc.).
- Las consideraciones para cumplir con los requerimientos no funcionales (rendimiento, seguridad, usabilidad).
- La estrategia de despliegue en Vercel y Supabase, aprovechando sus capas gratuitas.
- Un plan de trabajo por fases (sprints) alineado con la metodología Scrum.

Este plan servirá como guía para el equipo de desarrollo y garantizará que la implementación sea coherente, trazable y escalable.

---

## 2. Selección de Tecnologías y Justificación

| **Componente** | **Tecnología elegida** | **Justificación** |
|:---|:---|:---|
| **Frontend** | **React 18** + **Vite** + **Tailwind CSS** | React es el framework más maduro y cuenta con amplio soporte en Vercel. Vite ofrece un entorno de desarrollo ultrarrápido y compilación optimizada. Tailwind CSS permite un diseño ágil, responsivo y accesible (cumple con WCAG AA). |
| **Backend / API** | **Supabase** (Backend-as-a-Service) + **Vercel Serverless Functions** (para lógica compleja) | Supabase proporciona una base de datos PostgreSQL, autenticación integrada (con JWT), almacenamiento de archivos y funciones en tiempo real. Su plan gratuito es generoso (500 MB de base de datos, 2 GB de almacenamiento). Vercel Functions se usarán para operaciones que no pueden ejecutarse directamente en SQL o Edge Functions (ej. generación de PDF complejos). |
| **Base de Datos** | **PostgreSQL** (en Supabase) | Se ajusta a la restricción inicial del proyecto (CRC-RES-002) y es gestionado completamente por Supabase, con copias de seguridad automáticas y escalabilidad. |
| **Autenticación** | **Supabase Auth** (con proveedores: email/contraseña y opcionalmente Google) | Soporta múltiples roles, gestión de sesiones JWT, y se integra perfectamente con RLS para control de acceso a nivel de fila. |
| **Almacenamiento** | **Supabase Storage** (para PDFs de boletines, reportes, comprobantes) | Permite almacenar archivos con políticas de acceso basadas en roles (solo el estudiante/padre puede descargar su boletín). |
| **Gestión de estado** | **React Context** + **React Query** (para sincronización con API) | React Query simplifica la gestión de caché, peticiones asíncronas y actualización de datos. |
| **Despliegue** | **Vercel** (frontend y serverless functions) | Despliegue continuo desde GitHub, certificados SSL automáticos, CDN global y plan gratuito con límites suficientes para un proyecto educativo. |
| **Control de versiones** | **Git + GitHub** | Gratuito, integrado con Vercel, y permite flujo de trabajo basado en pull requests. |
| **Documentación API** | **Swagger/OpenAPI** (opcional) | Aunque Supabase genera automáticamente una API REST a partir de las tablas, para nuestras funciones personalizadas podemos documentarlas con OpenAPI. |
| **Pruebas** | **Jest + React Testing Library** (frontend), **Pytest** (para funciones Python en Vercel), **Supabase Local Dev** para pruebas de base de datos | Herramientas gratuitas y estándar. |

---

## 3. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         Usuarios                                │
│  (Estudiantes, Padres, Docentes, Coordinadores, Rector, Admin)  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS (TLS 1.3)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React SPA (desplegada en Vercel CDN)                   │   │
│  │  - Interfaz responsiva (Tailwind)                       │   │
│  │  - Consume API de Supabase directamente (mediante SDK)  │   │
│  │  - Llama a Vercel Functions para operaciones pesadas    │   │
│  └──────────────────────────────┬──────────────────────────┘   │
│                                 │                               │
│  ┌──────────────────────────────▼──────────────────────────┐   │
│  │  Vercel Serverless Functions (Node.js / Python)         │   │
│  │  - Generación de PDFs (boletines, reportes)             │   │
│  │  - Procesamiento de datos complejos (agregaciones)      │   │
│  │  - Validaciones que requieren lógica de negocio extensa │   │
│  └──────────────────────────────┬──────────────────────────┘   │
└─────────────────────────────────┼────────────────────────────────┘
                                  │ HTTPS / JWT
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Supabase (Backend)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (Base de datos)                            │   │
│  │  - Tablas: estudiantes, docentes, asignaturas, ...     │   │
│  │  - Row Level Security (RLS) para control de acceso     │   │
│  │  - Funciones SQL (procedimientos almacenados)          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Supabase Auth (JWT, roles)                            │   │
│  │  - Gestión de usuarios y perfiles                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Supabase Storage (archivos)                           │   │
│  │  - Almacenamiento de PDF de boletines y comprobantes   │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Flujo de datos:**  
1. El usuario accede al frontend (React) alojado en Vercel.  
2. El frontend se autentica mediante Supabase Auth y obtiene un JWT.  
3. Todas las peticiones a la API de Supabase (tablas, funciones, storage) se realizan con el token JWT en el header `Authorization`.  
4. Supabase aplica **RLS** (Row Level Security) para garantizar que cada usuario solo acceda a los datos permitidos según su rol.  
5. Las operaciones que requieren procesamiento en servidor (generación de PDF, reportes complejos) son enviadas a **Vercel Serverless Functions**, que a su vez pueden leer/escribir en Supabase usando el SDK y sus credenciales de servicio (con permisos elevados).  
6. Los archivos generados (boletines, reportes) se almacenan en Supabase Storage con políticas de acceso público o privado según el caso.

---

## 4. Diseño de la Base de Datos en Supabase (PostgreSQL)

El esquema se basa en los requerimientos funcionales y mantiene la normalización adecuada. Se utilizará el **esquema `public`** por defecto en Supabase, pero se recomienda crear un esquema `colegio` para organizar mejor.

### 4.1. Tablas Principales

| **Tabla** | **Descripción** | **Columnas clave** |
|:---|:---|:---|
| `usuarios` | Extiende la tabla `auth.users` de Supabase (se crea una tabla pública con referencia al `id` de auth). | `id` (UUID, PK, referencia a auth.users), `rol` (text: administrador, rector, coordinador, docente, estudiante, padre), `nombre`, `email`, `telefono`, `fecha_creacion` |
| `estudiantes` | Datos personales y académicos del estudiante. | `id` (PK, UUID), `usuario_id` (FK a `usuarios.id`), `identificacion` (único), `nombre_completo`, `fecha_nacimiento`, `grado_actual`, `direccion`, `telefono_contacto`, `email_contacto` |
| `docentes` | Perfil del docente. | `id` (PK, UUID), `usuario_id` (FK), `identificacion`, `nombre_completo`, `especialidad`, `email` |
| `asignaturas` | Asignaturas del plan de estudios. | `id` (PK, UUID), `nombre`, `codigo`, `grado` (text), `docente_id` (FK a `docentes.id`) |
| `periodos_academicos` | Períodos escolares (ej. 2026-1). | `id` (PK, UUID), `nombre`, `fecha_inicio`, `fecha_fin`, `activo` (boolean) |
| `matriculas` | Inscripción de estudiantes a un período y grado. | `id` (PK, UUID), `estudiante_id` (FK), `periodo_id` (FK), `grado`, `estado` (activo/inactivo), `fecha_matricula`, `comprobante_url` (opcional) |
| `horarios` | Horario de clases por grado, día y hora. | `id` (PK, UUID), `grado`, `dia_semana` (1-7), `hora_inicio`, `hora_fin`, `asignatura_id` (FK), `aula` |
| `asistencias` | Registro diario de asistencia. | `id` (PK, UUID), `estudiante_id` (FK), `fecha`, `estado` (presente, ausente, justificado), `docente_id` (FK que registra) |
| `calificaciones` | Notas por estudiante, asignatura y período. | `id` (PK, UUID), `estudiante_id` (FK), `asignatura_id` (FK), `periodo_id` (FK), `nota_numerica` (float), `nota_literal` (opcional), `fecha_registro`, `docente_id` (FK) |
| `disciplina` | Registros disciplinarios. | `id` (PK, UUID), `estudiante_id` (FK), `fecha`, `tipo` (llamado de atención, amonestación, compromiso), `descripcion`, `responsable_id` (FK a `usuarios.id`), `notificado_padre` (boolean) |
| `reportes_generados` | Metadatos de reportes y boletines generados. | `id` (PK, UUID), `estudiante_id` (FK, opcional), `tipo` (boletin, reporte_asistencia, etc.), `fecha_generacion`, `url_archivo` (en Storage), `generado_por` (FK a `usuarios.id`) |

### 4.2. Relaciones y Claves Foráneas

- `estudiantes.usuario_id` → `usuarios.id` (cuando el usuario es estudiante).  
- `docentes.usuario_id` → `usuarios.id`.  
- Las tablas que almacenan registros de estudiantes (matrículas, asistencias, calificaciones, disciplina) tienen FK a `estudiantes.id`.  
- Las tablas que involucran docentes (asignaturas, asistencias, calificaciones) tienen FK a `docentes.id` o `usuarios.id` según convenga.

### 4.3. Políticas de Seguridad (RLS)

Supabase permite definir políticas por fila usando el token JWT del usuario. Ejemplos:

- **Política para `estudiantes`**:  
  - `SELECT`: el estudiante solo puede ver su propio registro; el padre puede ver los registros de sus hijos vinculados (se necesita una tabla de relación padre-hijo); el docente y coordinador pueden ver todos los estudiantes de su grado.  
  - `INSERT/UPDATE`: solo secretaría o administrador.

- **Política para `calificaciones`**:  
  - `SELECT`: el estudiante ve solo sus calificaciones; el padre ve las de sus hijos; el docente ve las de sus asignaturas.  
  - `INSERT/UPDATE`: solo el docente asignado a la asignatura.

- **Política para `matriculas`**:  
  - `SELECT`: el estudiante/padre ve sus propias matrículas; secretaría y administrador ven todas.  
  - `INSERT/UPDATE`: solo secretaría y administrador.

Las políticas se definen en SQL con la sintaxis de Supabase, usando `auth.uid()` y `auth.jwt()` para obtener el rol.

---

## 5. Implementación de los Requerimientos Funcionales (RF)

A continuación, se detalla cómo se implementará cada RF en la arquitectura propuesta. Se indica el componente técnico responsable (tabla, función SQL, Edge Function, Vercel Function, frontend).

| **RF** | **Implementación técnica** |
|:---|:---|
| **CRC-RF-001** Registrar estudiantes | **Frontend:** Formulario que envía datos a Supabase (tabla `estudiantes`). **Backend:** RLS permite inserción solo a usuarios con rol `secretaria` o `admin`. Se valida identificación única mediante restricción `UNIQUE` en la tabla. Búsqueda rápida usando índice en `nombre` y `identificacion`. |
| **CRC-RF-002** Gestionar docentes | Similar a RF-001, pero con tabla `docentes`. La eliminación se controla con una función SQL que verifica si tiene asignaturas activas antes de permitir el borrado lógico (se puede usar `estado` en lugar de eliminar). |
| **CRC-RF-003** Gestionar asignaturas | Tabla `asignaturas`. Se utiliza una función SQL que valida que no haya calificaciones o matrículas asociadas antes de eliminar. El frontend muestra mensajes de error. |
| **CRC-RF-004** Procesar matrícula | **Frontend:** Formulario de matrícula. **Backend:** Inserción en tabla `matriculas` con validación de duplicados (consulta SQL) y disponibilidad de cupos (función SQL que cuenta matriculados por grado y período). La generación del comprobante PDF se realizará en Vercel Function (usando `pdfkit` o `puppeteer`) y se subirá a Supabase Storage, guardando la URL en `comprobante_url`. |
| **CRC-RF-005** Registrar calificaciones | Inserción/actualización en tabla `calificaciones`. RLS asegura que solo el docente asignado a la asignatura pueda registrar. Se guarda trazabilidad con `fecha_registro` y `docente_id`. |
| **CRC-RF-006** Consultar calificaciones | **Frontend:** Página que consulta la tabla `calificaciones` con filtros, aplicando RLS para que cada usuario vea solo lo permitido. Se puede usar `Supabase Realtime` para actualización en tiempo real. |
| **CRC-RF-007** Gestionar horarios | Tabla `horarios`. Las validaciones de conflicto (docente y aula) se implementan mediante una función SQL que verifica superposición antes de insertar/actualizar. Frontend muestra horario en vista semanal. |
| **CRC-RF-008** Controlar asistencia | Registro diario en tabla `asistencias`. El docente marca asistencia (frontend) y el sistema calcula porcentajes con una función SQL agregada. La notificación al padre tras 3 inasistencias consecutivas se activa mediante un **trigger** en la base de datos que llama a una **Edge Function** de Supabase (o una Vercel Function) para enviar email/SMS (usando SendGrid o Twilio, ambos con capas gratuitas). |
| **CRC-RF-009** Seguimiento disciplinario | Inserción en tabla `disciplina`. RLS permite a coordinadores y docentes insertar. Al insertar, un trigger envía notificación al padre (similar a RF-008). |
| **CRC-RF-010** Generar boletines | **Flujo:** El usuario solicita generar boletín desde el frontend. Se envía petición a una **Vercel Function** que: 1) Obtiene datos de calificaciones, asistencias y observaciones de Supabase; 2) Genera un PDF con el diseño institucional (usando `@react-pdf/renderer` o `pdfmake`); 3) Sube el PDF a Supabase Storage; 4) Guarda la URL en `reportes_generados`; 5) Devuelve la URL al frontend para descarga. El RLS permite que solo el estudiante/padre pueda descargar su boletín (política en Storage). |
| **CRC-RF-011** Generar reportes | Similar a RF-010, pero con datos agregados (tasas de aprobación, deserción). **Vercel Function** genera Excel (usando `xlsx`) o PDF y lo almacena en Storage. Los reportes pueden ser descargados por Rector y Secretaría de Educación (RLS en Storage según rol). |
| **CRC-RF-012** Autenticar usuarios | Se utiliza **Supabase Auth** con proveedor email/contraseña. El JWT generado contiene el `rol` del usuario (almacenado en la tabla `usuarios`). El frontend maneja el flujo de login, registro y recuperación de contraseña. |
| **CRC-RF-013** Gestionar roles y permisos | Solo administrador puede crear/editar usuarios y asignar roles. Supabase permite gestionar usuarios a través de su API de administración (con clave de servicio). El frontend mostrará un panel administrativo que usa las funciones de admin de Supabase. |
| **CRC-RF-014** Consultar horarios (público) | El frontend consulta la tabla `horarios` filtrando por grado del estudiante autenticado (o público si se permite). La vista se optimiza para móviles con Tailwind. |

---

## 6. Cumplimiento de Requerimientos No Funcionales (RNF)

| **RNF** | **Estrategia de cumplimiento** |
|:---|:---|
| **CRC-RNF-001** Tiempo de respuesta (<3s) | - Uso de índices en la base de datos (especialmente en FK y campos de búsqueda). - Limitación de resultados con paginación. - Vercel CDN para entrega rápida del frontend. - Supabase tiene conexiones optimizadas con PgBouncer. |
| **CRC-RNF-002** Disponibilidad (99%) | Vercel ofrece SLA del 99.9% (plan gratuito). Supabase también ofrece alta disponibilidad. Programación de mantenimientos fuera de horario (7pm-7am). |
| **CRC-RNF-003** Seguridad de comunicación | HTTPS obligatorio (Vercel y Supabase lo proporcionan por defecto, TLS 1.2+). |
| **CRC-RNF-004** Autenticación robusta | Supabase Auth con JWT. Cada petición a la API debe incluir el token. Se configurará un tiempo de expiración de 8 horas y refresh token. |
| **CRC-RNF-005** Usabilidad y accesibilidad | Uso de Tailwind con componentes accesibles (ARIA). Pruebas con Lighthouse y herramientas de accesibilidad. Diseño responsivo con `flex` y `grid`. |
| **CRC-RNF-006** Escalabilidad | La arquitectura serverless escala automáticamente. Supabase permite aumentar recursos pagando, pero el diseño con índices y consultas eficientes permitirá manejar un crecimiento considerable (cientos de usuarios). |
| **CRC-RNF-007** Mantenibilidad y documentación | - Código modular (React con componentes). - Uso de TypeScript para tipado. - Documentación de API mediante comentarios JSDoc y Swagger para Vercel Functions. - Supabase genera documentación automática de tablas y funciones. |
| **CRC-RNF-008** Protección de datos personales | - Cifrado en tránsito (HTTPS). - En reposo, Supabase cifra los datos en disco. - RLS garantiza que solo usuarios autorizados accedan a datos sensibles. - Uso de columnas `encrypted` para datos especialmente sensibles (ej. identificación, teléfono) usando la extensión `pgcrypto`. - Los logs de acceso se registran en Supabase Audit. |
| **CRC-RNF-009** Soporte a navegadores modernos | El build de Vite genera código compatible con navegadores recientes. Se usará `@vitejs/plugin-legacy` si se requiere soporte a navegadores antiguos, pero no es necesario según criterio (últimas 2 versiones). |

---

## 7. Estrategia de Despliegue y CI/CD

- **Repositorio:** GitHub (privado o público, según política).  
- **Integración continua:** Vercel se conecta al repositorio y despliega automáticamente cada `push` a `main` (producción) y a `develop` (preview).  
- **Entornos:**  
  - **Desarrollo local:** Uso de Supabase CLI para levantar una instancia local de PostgreSQL y emular funciones.  
  - **Preview (Vercel):** Despliegue automático para cada PR, usando una base de datos Supabase de desarrollo (proyecto separado).  
  - **Producción:** Proyecto Supabase dedicado para datos reales.  
- **Variables de entorno:** En Vercel se configuran las URLs y claves de Supabase (anon y service role) según el entorno.  
- **Migraciones de base de datos:** Se utilizará **Supabase Migrations** (con archivos SQL versionados) para mantener el esquema sincronizado entre entornos.  

---

## 8. Plan de Implementación por Fases (Sprints)

Basado en la metodología Scrum y la prioridad MoSCoW, se propone un cronograma de 6 sprints de 2 semanas (total 12 semanas, ajustable a los 9 meses del proyecto). Se organizan por releases.

| **Sprint** | **Objetivo** | **RF a implementar** | **Entregables** |
|:---|:---|:---|:---|
| **Sprint 0** | Configuración de infraestructura y proyectos base | - | Repositorio configurado, proyectos Vercel y Supabase creados, entorno local funcional, pipeline CI/CD básico. |
| **Sprint 1** | Autenticación y gestión de usuarios | RF-012, RF-013 | Login, registro, panel de administración de roles, RLS básico. |
| **Sprint 2** | Gestión de estudiantes, docentes, asignaturas y matrícula | RF-001, RF-002, RF-003, RF-004 | CRUD de estudiantes, docentes, asignaturas; proceso de matrícula con comprobante PDF. |
| **Sprint 3** | Calificaciones y asistencias | RF-005, RF-006, RF-008 | Registro de notas, consulta de calificaciones, control de asistencia y notificaciones básicas. |
| **Sprint 4** | Horarios y disciplina | RF-007, RF-009 | Gestión de horarios con validación de conflictos; seguimiento disciplinario con notificaciones. |
| **Sprint 5** | Reportes, boletines y pulido final | RF-010, RF-011, RF-014 | Generación de boletines y reportes en PDF/Excel; consulta pública de horarios; pruebas de aceptación y ajustes de usabilidad. |
| **Sprint 6** | Pruebas integrales, documentación y despliegue final | Todos | Pruebas de carga, revisión de RNF, documentación (Swagger, manuales), despliegue en producción. |

---

## 9. Herramientas Gratuitas y Limitaciones

| **Herramienta** | **Plan gratuito** | **Límites relevantes** | **Estrategia para mantenerse dentro** |
|:---|:---|:---|:---|
| **Vercel** (Hobby) | 100 GB de ancho de banda/mes, 100 builds/día, funciones serverless con tiempo de ejecución de 10s en Hobby (ampliable a 60s con función). | Tiempo de ejecución limitado para funciones pesadas. | Para generación de PDF complejos, si excede 10s, se puede dividir en pasos o usar un proceso asíncrono con cola (ej. usar Upstash Redis para encolar). También se puede optar por una función de mayor tiempo pagando, pero inicialmente se optimizará el código para ser rápido. |
| **Supabase** (Free) | 500 MB de base de datos, 2 GB de almacenamiento, 2 GB de ancho de banda, 50.000 usuarios auth, 30.000 solicitudes de funciones Edge/mes. | Almacenamiento de PDFs podría crecer. | Optimizar tamaño de PDFs, eliminar reportes antiguos, y si se supera, se puede pasar a plan Pro (25$). |
| **SendGrid** (email) | 100 emails/día (gratuito) | Limitado para notificaciones masivas. | Las notificaciones serán principalmente para padres y docentes, número bajo (c<100). Si crece, se puede migrar a otro proveedor o usar el plan gratuito de Mailgun (10k/mes). |
| **Twilio** (SMS) | No tiene plan gratuito (solo crédito de prueba). | Para envío de SMS, se puede usar WhatsApp Business API o simplemente email. | En lugar de SMS, se usarán emails para notificaciones. Si se requiere SMS, se puede integrar con Twilio pagando. |
| **GitHub** | Repositorios públicos o privados con colaboradores ilimitados (gratuito). | Ninguno relevante. | - |

---

## 10. Próximos Pasos Inmediatos

1. **Configurar entornos:** Crear cuenta en Vercel y Supabase. Crear proyectos y obtener claves.  
2. **Inicializar repositorio:** Estructurar carpetas (`frontend/`, `backend/` - si se usan Vercel Functions, etc.).  
3. **Definir el esquema de base de datos** en Supabase usando migraciones SQL (incluir RLS).  
4. **Configurar autenticación** en Supabase y probar el flujo de login desde una aplicación React mínima.  
5. **Desarrollar el primer sprint (Sprint 1)** siguiendo la planificación.  

---

## 11. Conclusión

Hemos refinado los detalles de implementación para el sistema de gestión del Colegio Recreacional Campestre, adoptando una arquitectura en la nube con Vercel y Supabase que aprovecha herramientas gratuitas y modernas. Cada requerimiento funcional ha sido mapeado a una solución técnica concreta, y se han establecido estrategias para cumplir con los atributos de calidad y las restricciones del proyecto. Este plan proporciona una guía clara para el equipo de desarrollo, garantizando la trazabilidad entre los requisitos y su implementación, y sentando las bases para un desarrollo ágil y escalable.

---

**Referencias adicionales:**

- Vercel Documentation. (2024). *Vercel Serverless Functions*. https://vercel.com/docs/functions  
- Supabase Documentation. (2024). *Supabase Auth, Database, Storage*. https://supabase.com/docs  
- React Documentation. (2024). *React Quick Start*. https://react.dev  
- PostgreSQL Documentation. (2024). *Row Security Policies*. https://www.postgresql.org/docs/current/ddl-rowsecurity.html  

---

**¿Listo para comenzar la implementación?**  
Si necesitas apoyo en la configuración inicial o en algún sprint específico, no dudes en pedírmelo. ¡Adelante!
