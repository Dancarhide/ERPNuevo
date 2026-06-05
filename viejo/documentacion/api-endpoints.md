# Referencia de API — ERP Sistema de Gestión

Base URL en desarrollo: `http://localhost:4000/api`

> Todos los endpoints (excepto `/auth/login` y `/ping`) requieren el header:
> ```
> Authorization: Bearer <token_jwt>
> ```

---

## 🔐 Autenticación — `/api/auth`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | Público | Inicia sesión. Retorna `{ token, user }` con `user.permissions[]` |

**Body de login:**
```json
{ "email": "admin@erp.com", "password": "Admin1234!" }
```

**Respuesta exitosa:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": 1, "nombre": "Administrador del Sistema",
    "rol": "Admin", "permissions": ["employees.view", "payroll.create", ...]
  }
}
```

---

## 👥 Empleados — `/api/empleados`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/empleados` | Admin, RH | Lista todos los empleados activos |
| `GET` | `/empleados/:id` | Admin, RH | Detalle de un empleado por ID |
| `POST` | `/empleados` | Admin, RH | Crear nuevo empleado (genera credenciales automáticamente) |
| `PUT` | `/empleados/:id` | Admin, RH | Actualizar datos del empleado |
| `DELETE` | `/empleados/:id` | Admin | Dar de baja a un empleado |

---

## 🏖️ Vacaciones — `/api/vacaciones`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/vacaciones` | Admin, RH, Jefe de Area | Lista todas las solicitudes |
| `GET` | `/vacaciones/mis-solicitudes` | Todos | Las solicitudes del usuario autenticado |
| `POST` | `/vacaciones` | Todos | Crear nueva solicitud de vacaciones |
| `PUT` | `/vacaciones/:id` | Admin, RH, Jefe de Area | Aprobar o rechazar una solicitud |
| `DELETE` | `/vacaciones/:id` | Admin, RH | Eliminar solicitud |

---

## 💰 Nómina — `/api/nominas`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/nominas/empleados` | Admin, RH, Contador | Empleados disponibles para generar nómina |
| `GET` | `/nominas/historial` | Admin, RH, Contador | Historial completo de todas las nóminas |
| `GET` | `/nominas/lotes` | Admin, RH, Contador | Lotes de nómina generados (agrupados) |
| `GET` | `/nominas/mis-nominas` | Todos | Nóminas del usuario autenticado |
| `POST` | `/nominas/bulk` | Admin, RH, Contador | Crear nóminas masivamente para un periodo |
| `POST` | `/nominas/:id/timbrar` | Admin, RH, Contador | Timbrar una nómina individual ante el SAT |
| `POST` | `/nominas/timbrar-bulk` | Admin, RH, Contador | Timbrar múltiples nóminas en una sola operación |
| `POST` | `/nominas/lote/:loteId/timbrar` | Admin, RH, Contador | Timbrar todas las nóminas de un lote |

---

## 📋 Conceptos de Nómina — `/api/conceptos-nomina`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/conceptos-nomina` | Admin, RH, Contador | Lista todos los conceptos (percepciones y deducciones) |
| `POST` | `/conceptos-nomina` | Admin, Contador | Crear nuevo concepto |
| `PUT` | `/conceptos-nomina/:id` | Admin, Contador | Actualizar concepto |
| `DELETE` | `/conceptos-nomina/:id` | Admin | Eliminar concepto |

---

## 🏢 Roles — `/api/roles`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/roles` | Admin, RH | Lista todos los roles del sistema |
| `POST` | `/roles` | Admin | Crear nuevo rol |
| `PUT` | `/roles/:id` | Admin | Actualizar nombre/descripción del rol |
| `DELETE` | `/roles/:id` | Admin | Eliminar un rol (solo si no tiene empleados) |

---

## ⚙️ Configuración Admin — `/api/admin/config`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/admin/config/resources` | Admin | Lista todos los recursos/módulos |
| `GET` | `/admin/config/permissions` | Admin | Lista todos los permisos del sistema |
| `GET` | `/admin/config/role-permissions/:roleId` | Admin | Permisos asignados a un rol |
| `POST` | `/admin/config/role-permissions` | Admin | Asignar permisos a un rol |
| `DELETE` | `/admin/config/role-permissions` | Admin | Quitar permiso de un rol |
| `GET` | `/admin/config/my-permissions` | Todos | Permisos del usuario autenticado |
| `GET` | `/admin/config/mis-permisos` | Todos | Alias de `my-permissions` |

---

## 📊 Dashboard — `/api/dashboard`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/dashboard/stats` | Todos | KPIs y actividad reciente del sistema |

**Respuesta:**
```json
{
  "empleadosActivos": 35,
  "vacacionesPendientes": 3,
  "vacantesAbiertas": 2,
  "nominaMesActual": 485000,
  "actividadReciente": [...]
}
```

---

## 🗺️ Organigrama — `/api/organigrama`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/organigrama` | Admin, RH, Directivo, Jefe de Area | Árbol jerárquico de empleados y áreas |

---

## 📍 Áreas — `/api/areas`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/areas` | Admin, RH | Lista todas las áreas de la empresa |

---

## 🎯 Vacantes y Reclutamiento

### Vacantes — `/api/vacantes`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/vacantes` | Admin, RH | Lista todas las vacantes |
| `POST` | `/vacantes` | Admin, RH | Crear nueva vacante |
| `PUT` | `/vacantes/:id` | Admin, RH | Actualizar vacante |
| `DELETE` | `/vacantes/:id` | Admin, RH | Eliminar vacante |

### Candidatos — `/api/candidatos`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/candidatos` | Admin, RH | Lista candidatos |
| `POST` | `/candidatos` | Admin, RH | Registrar candidato |
| `PUT` | `/candidatos/:id` | Admin, RH | Actualizar candidato |

### CyI (Captación e Inducción) — `/api/cyi`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/cyi` | Admin, RH | Estado del pipeline de reclutamiento |
| `POST` | `/cyi` | Admin, RH | Crear etapa del proceso |
| `PUT` | `/cyi/:id` | Admin, RH | Actualizar etapa |

---

## 🚨 Incidencias — `/api/incidencias`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/incidencias` | Todos | Lista incidencias (filtradas por rol) |
| `POST` | `/incidencias` | Todos | Registrar nueva incidencia |
| `PUT` | `/incidencias/:id` | Admin, RH, Jefe de Area | Actualizar estatus de incidencia |

---

## 📝 Encuestas de Clima — `/api/encuestas`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/encuestas` | Todos | Lista encuestas disponibles |
| `POST` | `/encuestas` | Admin, RH | Crear nueva encuesta |
| `GET` | `/encuestas/:id/resultados` | Admin, RH | Ver resultados de una encuesta |
| `POST` | `/encuestas/:id/responder` | Todos | Responder encuesta |

---

## 🔔 Notificaciones — `/api/notificaciones`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/notificaciones` | Todos | Notificaciones del usuario autenticado |
| `PUT` | `/notificaciones/:id/leer` | Todos | Marcar notificación como leída |

---

## 💬 Chat — `/api/chat`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/chat/conversaciones` | Todos | Lista de conversaciones del usuario |
| `POST` | `/chat/conversaciones` | Todos | Crear nueva conversación |
| `GET` | `/chat/conversaciones/:id/mensajes` | Todos | Mensajes de una conversación |
| `POST` | `/chat/conversaciones/:id/mensajes` | Todos | Enviar mensaje |

---

## 📅 Eventos — `/api/eventos`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/eventos` | Todos | Lista de eventos de la empresa |
| `POST` | `/eventos` | Admin, RH | Crear evento |
| `DELETE` | `/eventos/:id` | Admin, RH | Eliminar evento |

---

## 🏗️ Puestos — `/api/puestos`

| Método | Ruta | Roles permitidos | Descripción |
|---|---|---|---|
| `GET` | `/puestos` | Admin, RH | Lista de puestos del catálogo |
| `POST` | `/puestos` | Admin, RH | Crear puesto |
| `PUT` | `/puestos/:id` | Admin, RH | Actualizar puesto |

---

## 🏓 Health Check

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/ping` | Público | Verifica que el servidor está corriendo |

**Respuesta:** `{ "pong": true, "time": "2026-04-22T19:00:00.000Z" }`

---

## Códigos de respuesta HTTP comunes

| Código | Significado |
|---|---|
| `200` | OK — operación exitosa |
| `201` | Created — recurso creado exitosamente |
| `400` | Bad Request — datos inválidos o faltantes |
| `401` | Unauthorized — token faltante o inválido |
| `403` | Forbidden — sin permisos para esta acción |
| `404` | Not Found — recurso no encontrado |
| `429` | Too Many Requests — rate limit excedido (login) |
| `500` | Internal Server Error — error del servidor |
