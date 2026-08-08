# Plan de implementación por sprints de Arandu

Este plan organiza el desarrollo del producto en sprints, priorizando primero
las funcionalidades que tienen mayor impacto operativo y que además habilitan el
resto del sistema.

## 1. Criterios de priorización

### 1.1 Estado actual del proyecto

La base del proyecto ya está parcialmente construida y debe aprovecharse para
acelerar el desarrollo. En la implementación actual se cuenta con:

- autenticación básica y flujo de sesión;
- un dashboard por rol;
- navegación dinámica basada en permisos;
- un panel administrativo para gestión de roles;
- una estructura modular preparada para crecer hacia módulos académicos.

Lo que falta ahora es convertir esa base en una solución más operativa,
conectada a datos reales y orientada a procesos escolares concretos. Por eso, la
priorización debe considerar no solo el impacto del módulo, sino también qué tan
bien se puede reutilizar lo que ya existe.

Se priorizaron las tareas de acuerdo con tres criterios:

1. Impacto en el negocio y la operación escolar.
2. Dependencia con otras funcionalidades.
3. Cantidad de acciones necesarias para completar el módulo.

### Prioridades

- P0: funcionalidad crítica, base del sistema y con alto impacto.
- P1: funcionalidad importante, pero depende de la base ya construida.
- P2: mejora, pulido o extensión del producto.

---

## 2. Estrategia general

El desarrollo debe avanzar de forma incremental:

- primero la base de acceso, roles y datos maestros;
- luego los procesos académicos esenciales;
- después la trazabilidad, reportes y mejora de experiencia.

---

## 3. Sprint 0 — Consolidación de la base actual

### Objetivo

Aprovechar y estabilizar lo que ya está implementado antes de sumar módulos más
complejos.

### Prioridad

P0

### Tareas concretas

- revisar y limpiar la estructura actual de rutas, navegación y protección por
  rol;
- consolidar los servicios reutilizables para datos y estados de carga;
- definir modelos de datos base para estudiantes, docentes, asignaturas,
  matrículas y perfiles;
- preparar la conexión con Supabase para que los módulos futuros trabajen con
  datos reales;
- definir una guía de componentes reutilizables para tablas, formularios y
  alertas.

### Entregables

- base técnica más estable y reutilizable;
- estructura de datos base definida;
- componentes UI base listos para escalar.

---

## 4. Sprint 1 — Fortalecer acceso, roles y administración

### Objetivo

Convertir la base actual en una capa operativa de administración real y segura.

### Prioridad

P0

### Tareas concretas

- reforzar el flujo de login y registro con validaciones más claras;
- mejorar la administración de usuarios y roles con estados de cuenta y permisos
  más explícitos;
- asegurar que la navegación del dashboard responda de forma consistente a los
  permisos del usuario;
- proteger vistas sensibles con reglas más robustas y mensajes de error más
  útiles;
- documentar las reglas de seguridad y acceso para cada rol.

### Entregables

- acceso seguro y más confiable;
- administración de roles operativa;
- experiencia de administración más preparada para uso real.

---

## 5. Sprint 2 — Gestión de estudiantes y docentes

### Objetivo

Implementar el núcleo de gestión de personas del sistema escolar.

### Prioridad

P0

### Tareas concretas

- crear la vista de listado de estudiantes con búsqueda y filtros;
- desarrollar el formulario de creación y edición de estudiantes;
- implementar la vista de docentes con datos básicos de contacto y especialidad;
- crear la relación entre estudiante y acudiente o padre;
- preparar la gestión de estado activo/inactivo para perfiles;
- agregar validaciones de datos obligatorios.

### Entregables

- CRUD de estudiantes;
- CRUD de docentes;
- vistas listas para operar con información real.

---

## 6. Sprint 3 — Catálogo académico y proceso de matrícula

### Objetivo

Poner en funcionamiento los módulos que permiten organizar la oferta académica y
formalizar la matrícula.

### Prioridad

P0

### Tareas concretas

- crear el módulo de asignaturas con código, nombre, grado y docente
  responsable;
- desarrollar el flujo de matrícula con formulario paso a paso;
- asociar matrícula a estudiante, periodo y grado;
- validar que no existan matrículas duplicadas para el mismo periodo;
- generar un comprobante básico de matrícula en PDF o documento descargable;
- agregar estados de matrícula: activa, pendiente, finalizada o suspendida.

### Entregables

- catálogo académico funcional;
- proceso de matrícula completado;
- comprobante generado correctamente.

---

## 7. Sprint 4 — Calificaciones y asistencia

### Objetivo

Implementar las funcionalidades más visibles para docentes, estudiantes y
padres.

### Prioridad

P0

### Tareas concretas

- crear la vista de registro de calificaciones por asignatura y estudiante;
- desarrollar la vista de consulta de calificaciones por estudiante o padre;
- implementar registro de asistencia diaria;
- agregar estados de asistencia: presente, ausente, justificado;
- mostrar indicadores básicos de rendimiento y porcentaje de asistencia;
- proteger las operaciones para que solo docentes autorizados puedan editar.

### Entregables

- registro y consulta de calificaciones;
- registro y consulta de asistencia;
- información académica visible para usuarios correspondientes.

---

## 8. Sprint 5 — Horarios y disciplina

### Objetivo

Ampliar el control académico con módulos de seguimiento y organización del día a
día escolar.

### Prioridad

P1

### Tareas concretas

- crear la gestión de horarios por grado, día y asignatura;
- asociar docentes, aulas y franjas horarias;
- mostrar horarios en vista semanal o por día;
- desarrollar el módulo de incidencias disciplinarias;
- registrar gravedad, descripción y responsable;
- mostrar historial disciplinario por estudiante.

### Entregables

- horarios visibles y editables;
- seguimiento disciplinario funcional.

---

## 9. Sprint 6 — Reportes, boletines y documentos

### Objetivo

Entregar valor institucional con reportes y documentos descargables.

### Prioridad

P1

### Tareas concretas

- construir el módulo de generación de boletines;
- crear reportes de asistencia y rendimiento;
- preparar exportación a PDF o formato descargable;
- mostrar historial de reportes generados;
- restringir la descarga a los usuarios autorizados.

### Entregables

- boletines y reportes generados;
- documentos accesibles según permisos.

---

## 10. Sprint 7 — Notificaciones, auditoría y pulido final

### Objetivo

Mejorar la experiencia del sistema y cerrar brechas de seguridad y trazabilidad.

### Prioridad

P2

### Tareas concretas

- implementar alertas para ausencias repetidas o incidencias importantes;
- preparar registro de auditoría para cambios sensibles;
- mejorar la experiencia de usuario con mensajes de éxito, error y carga;
- revisar usabilidad en tablas, formularios y navegación móvil;
- medir y corregir problemas de accesibilidad básicos.

### Entregables

- sistema más usable y trazable;
- notificaciones básicas operativas;
- versión más preparada para producción.

---

## 11. Resumen de priorización por impacto

| Módulo                            | Impacto  | Prioridad | Razón                                                                |
| --------------------------------- | -------- | --------- | -------------------------------------------------------------------- |
| Autenticación y roles             | Muy alto | P0        | Ya existe una base importante y debe reforzarse para uso real        |
| Gestión de estudiantes y docentes | Muy alto | P0        | Es el núcleo del manejo académico y el siguiente paso lógico         |
| Matrícula                         | Muy alto | P0        | Es un proceso esencial y muy visible para la operación institucional |
| Calificaciones y asistencia       | Muy alto | P0        | Afecta directamente la experiencia docente, estudiantil y familiar   |
| Horarios y disciplina             | Medio    | P1        | Añade organización y control al día a día escolar                    |
| Reportes y boletines              | Medio    | P1        | Genera valor institucional y comunicación con familias               |
| Notificaciones y auditoría        | Medio    | P2        | Mejora la operación, trazabilidad y seguridad del sistema            |

---

## 12. Recomendación de ejecución

Se recomienda ejecutar los sprints en este orden para evitar re-trabajo y
aprovechar lo que ya está implementado:

1. consolidación de la base actual;
2. reforzamiento de acceso y roles;
3. estudiantes y docentes;
4. matrícula;
5. calificaciones y asistencia;
6. horarios y disciplina;
7. reportes y boletines;
8. pulido, auditoría y notificaciones.

Este orden permite que el proyecto evolucione de forma estable, con un impacto
inmediato en la operación del colegio y con menos riesgo de construir módulos
que luego deban reestructurarse.
