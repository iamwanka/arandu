# Especificación funcional de Arandu

Este documento convierte los requerimientos del proyecto en una propuesta clara
de funcionalidades, permisos y experiencias de interacción para la aplicación.

## 1. Objetivo del producto

Arandu es una plataforma web para la gestión escolar que permitirá a una
institución educativa administrar:

- autenticación y acceso seguro;
- gestión de usuarios y roles;
- información académica de estudiantes;
- procesos de matrícula;
- seguimiento de asistencia y calificaciones;
- reportes, boletines y trazabilidad de procesos.

La aplicación debe estar preparada para funcionar con un modelo de roles claro,
una experiencia amigable y una arquitectura que permita crecer por módulos.

---

## 2. Usuarios y roles del sistema

Los roles definidos en la solución actual son:

- administrador
- coordinador
- docente
- estudiante
- padre/acudiente

### 2.1 Rol: Administrador

Permisos principales:

- gestionar usuarios y asignar roles;
- administrar configuraciones generales del sistema;
- ver reportes institucionales;
- gestionar estudiantes, docentes, materias y matrículas;
- supervisar seguridad, auditoría y permisos.

### 2.2 Rol: Coordinador

Permisos principales:

- administrar procesos académicos generales;
- supervisar matrículas, horarios y seguimiento institucional;
- revisar reportes y estados de los estudiantes;
- gestionar incidencias disciplinarias y comunicaciones.

### 2.3 Rol: Docente

Permisos principales:

- registrar asistencia;
- registrar calificaciones;
- ver información de sus estudiantes y asignaturas;
- consultar horarios y tareas asignadas;
- generar observaciones o reportes básicos.

### 2.4 Rol: Estudiante

Permisos principales:

- consultar su información personal;
- ver calificaciones y asistencia;
- consultar horarios;
- visualizar boletines y reportes personales;
- recibir notificacione s y alertas relevantes.

### 2.5 Rol: Padre / acudiente

Permisos principales:

- ver información de sus hijos;
- consultar calificaciones y asistencia;
- revisar reportes y observaciones;
- recibir notificaciones sobre comportamiento o incidencias.

---

## 3. Módulos funcionales de la aplicación

### 3.1 Autenticación y acceso

Funcionalidades:

- registro e ingreso con correo y contraseña;
- recuperación de contraseña;
- cierre de sesión seguro;
- carga de sesión y validación de permisos por rol;
- redirección automática según el tipo de usuario.

Comportamiento esperado:

- cada usuario entra a un panel específico según su rol;
- el sistema debe mostrar únicamente las opciones permitidas.

---

### 3.2 Panel de inicio o dashboard

Funcionalidades:

- resumen ejecutivo del sistema;
- accesos rápidos a módulos principales;
- vista personalizada según rol;
- indicadores básicos de actividad, tareas y alertas.

Contenido por rol:

- administrador: visión general del sistema y seguridad;
- coordinador: seguimiento académico y procesos;
- docente: tareas, clases y seguimiento de estudiantes;
- estudiante: progreso personal y actividades;
- padre: seguimiento del hijo y notificaciones.

---

### 3.3 Gestión de usuarios y roles

Funcionalidades:

- listar usuarios del sistema;
- cambiar roles de usuario;
- activar o desactivar cuentas;
- ver estado de acceso y permisos.

Reglas de negocio:

- solo un administrador puede modificar roles sensibles;
- los cambios de permisos deben registrarse en auditoría.

---

### 3.4 Gestión académica

Este módulo cubre el núcleo del sistema educativo.

#### 3.4.1 Estudiantes

Funcionalidades:

- crear estudiantes;
- editar datos personales y académicos;
- consultar historial académico;
- asociar estudiante a un grado o curso;
- vincularlo con su acudiente o padre.

#### 3.4.2 Docentes

Funcionalidades:

- registrar docentes;
- asignar especialidad y datos de contacto;
- asociar docentes a asignaturas o grupos;
- activar o desactivar perfiles.

#### 3.4.3 Asignaturas

Funcionalidades:

- crear yeditar asignaturas;
- asignar docente responsable;
- clasificar por grado o nivel;
- activar o desactivar materias.

#### 3.4.4 Matrícula

Funcionalidades:

- iniciar proceso de matrícula;
- registrar datos del estudiante y del acudiente;
- asignar periodo académico;
- guardar comprobante de matrícula;
- consultar estado de la matrícula.

Reglas de negocio:

- no se debe duplicar una matrícula activa para el mismo periodo;
- la matrícula debe quedar ligada al estudiante y al periodo correspondiente.

---

### 3.5 Calificaciones y evaluación

Funcionalidades:

- registrar calificaciones por estudiante y asignatura;
- consultar historial de notas;
- ver promedios y desempeño;
- filtrar por periodo, grado o materia.

Permisos:

- docentes pueden registrar y editar calificaciones de sus asignaturas;
- estudiantes y padres pueden ver solo su información;
- coordinadores y administradores pueden ver reportes consolidados.

---

### 3.6 Asistencia

Funcionalidades:

- registrar asistencia diaria;
- marcar presente, ausente o justificado;
- consultar porcentaje de asistencia;
- visualizar tendencias por curso o estudiante.

Reglas de negocio:

- la asistencia debe guardarse con fecha y responsable;
- si hay ausencias consecutivas, el sistema puede generar alertas.

---

### 3.7 Horarios

Funcionalidades:

- crear horarios por grado;
- asignar asignaturas, docentes y aulas;
- visualizar horarios por día y semana;
- consultar horarios desde el rol de estudiante o padre.

Reglas de negocio:

- no debe haber conflictos de docente o aula en la misma franja horaria.

---

### 3.8 Disciplina y seguimiento

Funcionalidades:

- registrar incidencias disciplinarias;
- indicar gravedad, descripción y responsable;
- marcar si se notificó al padre o acudiente;
- consultar historial disciplinario del estudiante.

Permisos:

- docentes y coordinadores pueden registrar incidencias;
- padres y estudiantes ven únicamente los registros correspondientes.

---

### 3.9 Reportes y boletines

Funcionalidades:

- generar boletines académicos;
- generar reportes de asistencia, rendimiento y disciplina;
- descargar archivos en PDF o formato exportable;
- almacenar historial de reportes generados.

Permisos:

- coordinadores y administradores pueden generar reportes institucionales;
- estudiantes y padres solo pueden ver sus documentos correspondientes.

---

### 3.10 Seguridad y auditoría

Funcionalidades:

- control de acceso basado en roles;
- políticas de seguridad por fila (RLS);
- revisión de acciones sensibles;
- registro de cambios en usuarios, roles y procesos.

Objetivo:

- asegurar que cada usuario solo vea lo que corresponde a su rol.

---

## 4. Matriz de permisos por rol

| Módulo                   | Admin | Coordinador | Docente | Estudiante | Padre |
| ------------------------ | ----- | ----------- | ------- | ---------- | ----- |
| Iniciar sesión           | Sí    | Sí          | Sí      | Sí         | Sí    |
| Ver dashboard            | Sí    | Sí          | Sí      | Sí         | Sí    |
| Gestionar usuarios       | Sí    | No          | No      | No         | No    |
| Gestionar roles          | Sí    | No          | No      | No         | No    |
| Gestionar estudiantes    | Sí    | Sí          | No      | No         | No    |
| Gestionar docentes       | Sí    | Sí          | No      | No         | No    |
| Gestionar asignaturas    | Sí    | Sí          | No      | No         | No    |
| Procesar matrículas      | Sí    | Sí          | No      | No         | No    |
| Registrar calificaciones | Sí    | Sí          | Sí      | No         | No    |
| Ver calificaciones       | Sí    | Sí          | Sí      | Sí         | Sí    |
| Registrar asistencia     | Sí    | Sí          | Sí      | No         | No    |
| Ver asistencia           | Sí    | Sí          | Sí      | Sí         | Sí    |
| Gestionar horarios       | Sí    | Sí          | No      | No         | No    |
| Registrar disciplina     | Sí    | Sí          | Sí      | No         | No    |
| Ver disciplina           | Sí    | Sí          | Sí      | Sí         | Sí    |
| Generar reportes         | Sí    | Sí          | No      | No         | No    |
| Ver boletines personales | Sí    | Sí          | No      | Sí         | Sí    |

---

## 5. Flujos de interacción principales

### 5.1 Flujo de acceso

1. El usuario ingresa correo y contraseña.
2. El sistema valida credenciales.
3. El sistema carga el perfil y rol.
4. Se muestra el dashboard correspondiente.

### 5.2 Flujo de matrícula

1. El coordinador o administrador inicia la matrícula.
2. Se ingresan datos del estudiante y del acudiente.
3. Se valida que no exista una matrícula activa duplicada.
4. Se guarda la información y se genera el comprobante.

### 5.3 Flujo de calificaciones

1. El docente accede a la vista del curso o asignatura.
2. Registra notas por estudiante.
3. El sistema guarda el registro con fecha y responsable.
4. El estudiante o padre puede consultar el resultado.

### 5.4 Flujo de asistencia

1. El docente marca la asistencia del día.
2. El sistema guarda el estado.
3. Si hay un patrón de ausencias, se activa una alerta.
4. El padre o acudiente puede visualizar la información.

### 5.5 Flujo de reportes

1. El usuario selecciona el tipo de reporte.
2. El sistema consulta los datos autorizados.
3. Se genera el documento y se ofrece para descargar.

---

## 6. Reglas de negocio recomendadas

- todo acceso debe validarse por rol y por contexto del usuario;
- no se debe permitir la edición de información sensible a usuarios sin permiso;
- los registros de notas, asistencia y disciplina deben conservar trazabilidad;
- las acciones críticas deben generar notificaciones o auditoría;
- los reportes deben estar limitados a los datos del usuario o del grupo
  autorizado.

---

## 7. Estado de implementación actual

La aplicación ya cuenta con una base inicial de:

- autenticación básica;
- panel de dashboard;
- gestión de roles desde un panel administrativo;
- navegación por roles;
- estructura modular para escalar a módulos académicos completos.

Lo siguiente sería implementar de forma progresiva:

1. gestión completa de estudiantes y docentes;
2. matrícula y documentos asociados;
3. registro de calificaciones y asistencia;
4. generación de reportes y boletines;
5. notificaciones y seguridad avanzada.

---

## 8. Propuesta de experiencia de usuario

La experiencia debe ser:

- clara y directa para usuarios administrativos;
- simple y visual para docentes;
- accesible y comprensible para estudiantes y padres;
- consistente en toda la aplicación, con navegación intuitiva y mensajes de
  feedback.

Se recomienda usar:

- paneles resumidos;
- tablas con filtros y búsqueda;
- formularios por pasos para procesos complejos como matrícula;
- alertas y estados claros para cada acción.

---

## 9. Resumen ejecutivo

La aplicación Arandu debe funcionar como una plataforma escolar completa, con
módulos especializados por rol. El objetivo no es solo registrar datos, sino
ofrecer una experiencia útil para la gestión institucional, el seguimiento
académico y la comunicación con estudiantes y familias.

El producto debe estar orientado a:

- reducir la carga operativa del personal;
- dar visibilidad clara del desempeño académico;
- proporcionar acceso seguro a la información;
- permitir crecer hacia una solución completa de gestión educativa.
