# Referencia de Funciones — ERP Sistema de Gestión

Funciones clave organizadas por capa: modelos, controllers y utilidades del frontend.

---

## 🗄️ Modelos del servidor (`server/src/models/`)

### `empleados.ts`

```typescript
// Obtiene un empleado completo con su área, rol y permisos incluidos en una sola query
getEmpleadoPorId(id: number): Promise<Empleado | null>
```

Retorna el objeto `Empleado` con todos sus campos más el array `permissions: string[]` con los
slugs de los permisos del rol. Se usa en el login para no necesitar una segunda llamada a la API.

---

### `credenciales.ts`

```typescript
// Crea el username (generado automáticamente) y hashea la contraseña con bcrypt
crearCredenciales(idempleado: number, nombreCompleto: string, passwordPlano: string): Promise<string>

// Actualiza la contraseña de un empleado (bcrypt hash)
resetearPasswordCredenciales(idempleado: number, passwordPlano: string): Promise<boolean>

// Verifica email + contraseña en el login. Retorna el ID del empleado o null
verificarCredenciales(email: string, passwordPlano: string): Promise<number | null>
```

---

## 🎛️ Controllers del servidor (`server/src/Controllers/`)

### `authController.ts`

```typescript
// POST /api/auth/login
// Verifica credenciales, genera JWT de 8h y retorna { token, user } con permissions[]
loginController(req, res)
```

---

### `empleadoController.ts`

```typescript
// GET /api/empleados — Lista empleados activos con filtros opcionales
getEmpleados(req, res)

// GET /api/empleados/:id — Detalle de un empleado
getEmpleadoById(req, res)

// POST /api/empleados — Crea empleado y sus credenciales automáticamente
createEmpleado(req, res)

// PUT /api/empleados/:id — Actualiza datos del empleado
updateEmpleado(req, res)

// DELETE /api/empleados/:id — Baja lógica del empleado
deleteEmpleado(req, res)
```

---

### `vacacionController.ts`

```typescript
// POST /api/vacaciones — Crea nueva solicitud con estatus "Pendiente"
createVacacion(req, res)

// GET /api/vacaciones — Lista solicitudes (filtradas por rol del usuario)
getVacaciones(req, res)

// PUT /api/vacaciones/:id — Aprueba o rechaza (usa $transaction para atomicidad)
//   Si se aprueba: descuenta días disponibles del empleado en la misma transacción
updateVacacionStatus(req, res)
```

> ⚠️ La aprobación es **atómica**: si falla el descuento de días, el estatus no cambia (y viceversa).

---

### `nominaController.ts`

```typescript
// GET /api/nominas/empleados — Empleados con sueldo para generar nómina
getEmpleadosParaNomina(req, res)

// POST /api/nominas/bulk — Crea múltiples nóminas en una transacción
//   Body: { nominas: [{ idempleado, fecha_inicio, fecha_fin, sueldo_base, detalles[] }] }
crearNominasBulk(req, res)

// GET /api/nominas/mis-nominas — Nóminas del usuario autenticado (usa req.user.id)
misNominas(req, res)

// GET /api/nominas/historial — Historial completo para reportes
obtenerHistorialNominas(req, res)

// GET /api/nominas/lotes — Lotes agrupados con totales y conteo de empleados
getLotesNominas(req, res)
```

---

### `nominaTimbradoController.ts`

```typescript
// POST /api/nominas/:id/timbrar — Timbra una nómina individual
timbrarNomina(req, res)

// POST /api/nominas/timbrar-bulk — Timbra una lista de IDs de nómina
timbrarNominasBulk(req, res)

// POST /api/nominas/lote/:loteId/timbrar — Timbra todas las nóminas de un lote
timbrarLote(req, res)

// Función privada helper — evita duplicación de código de timbrado
_procesarUnaNomina(idnomina: number, tx: PrismaTransactionClient): Promise<void>
```

---

### `adminConfigController.ts`

```typescript
// GET /api/admin/config/resources — Lista de módulos del sistema
getResources(req, res)

// GET /api/admin/config/permissions — Todos los permisos
getPermissions(req, res)

// GET /api/admin/config/role-permissions/:roleId — Permisos de un rol específico
getRolePermissions(req, res)

// POST /api/admin/config/role-permissions — Asignar permission a un rol
assignPermission(req, res)

// DELETE /api/admin/config/role-permissions — Quitar permission de un rol
removePermission(req, res)

// GET /api/admin/config/my-permissions — Permisos del usuario que hace la request
getMyPermissions(req, res)
```

---

### `dashboardController.ts`

```typescript
// GET /api/dashboard/stats — KPIs y actividad reciente
// Ejecuta 6 queries en paralelo con Promise.all() para máximo rendimiento
getDashboardStats(req, res)
```

---

### `rolesController.ts`

```typescript
// GET /api/roles — Lista todos los roles
getRoles(req, res)

// POST /api/roles — Crea nuevo rol
createRol(req, res)

// PUT /api/roles/:id — Actualiza nombre/descripción
updateRol(req, res)

// DELETE /api/roles/:id — Elimina rol (validar que no tenga empleados)
deleteRol(req, res)
```

---

## 🔒 Middleware (`server/src/middleware/auth.ts`)

```typescript
// Verifica el JWT del header Authorization: Bearer <token>
// Agrega req.user = { id, email, rol, idrol } para uso en controllers
authenticateToken(req, res, next)

// Verifica que req.user.rol esté en la lista de roles permitidos
// Uso: router.get('/ruta', authenticateToken, authorizeRoles('Admin', 'RH'), handler)
authorizeRoles(...roles: string[])(req, res, next)
```

---

## 🌐 Frontend — Utilidades (`src/utils/`)

### `permissions.ts`

```typescript
// Constantes de slugs de permisos — usar en lugar de strings hardcodeados
export const PERMISSIONS = {
    EMPLOYEES_VIEW:   'employees.view',
    EMPLOYEES_CREATE: 'employees.create',
    PAYROLL_VIEW:     'payroll.view',
    PAYROLL_CREATE:   'payroll.create',
    PAYROLL_STAMP:    'payroll.stamp',
    VACATIONS_APPROVE:'vacations.approve',
    ROLES_MANAGE:     'roles.manage',
    ADMIN_CONFIG:     'admin.config',
    // ... ver archivo completo para todos los slugs
};

// Verifica si el usuario logueado tiene un permiso específico
// Admin siempre retorna true (acceso total)
// Lee user.permissions[] guardado en localStorage/sessionStorage al hacer login
hasPermission(permissionSlug: string): boolean
```

**Uso en un componente:**
```tsx
import { hasPermission, PERMISSIONS } from '../utils/permissions';

// En la vista
{hasPermission(PERMISSIONS.EMPLOYEES_CREATE) && (
    <button onClick={crearEmpleado}>Nuevo Empleado</button>
)}
```

---

### Constantes de Roles (`src/App.tsx`)

```typescript
// Usar en ProtectedRoute en lugar de strings hardcodeados
export const ROLES = {
    ADMIN:       'Admin',
    RH:          'RH',
    CONTADOR:    'Contador',
    DIRECTIVO:   'Directivo',
    JEFE_AREA:   'Jefe de Area',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];
```

**Uso en rutas:**
```tsx
import { ROLES } from './App';

<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.RH]} />
```

---

## 🌱 Scripts de seed (`server/prisma/`)

### `seed.ts` — Datos base del sistema

Crea (idempotente, usa `upsert`):
- **5 áreas**: Dirección General, RH, Administración, Operaciones, TI
- **7 roles**: Admin, RH, Directivo, Jefe de Area, Contador, Empleado Normal, Externo
- **13 resources** (módulos del sistema)
- **22 permisos** y sus asignaciones a roles (63 combinaciones)
- **10 conceptos de nómina** (percepciones y deducciones SAT)
- **Días festivos** del año actual + siguiente
- **Usuario admin** con `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`

### `seed-demo-users.ts` — Usuarios de prueba

Crea dinámicamente (lee roles de la BD):
- **5 empleados por rol** con nombres mexicanos aleatorios
- Username generado automáticamente: `nombre.apellido.N`
- Email: `nombre.apellido.N@demo.erp`
- Contraseña igual para todos: `Demo1234!`
- Sueldo aleatorio según rango del rol
- Omite creación si el email ya existe (idempotente)

---

## 📡 Cliente HTTP del frontend (`src/api/client.ts`)

```typescript
// Instancia de Axios preconfigurada
// - Base URL: VITE_API_URL del .env (default: http://localhost:4000/api)
// - Interceptor: agrega automáticamente el token JWT en cada request
// - Interceptor de respuesta: si 401, redirige al login

import client from '../api/client';

// Uso en cualquier componente
const res = await client.get('/empleados');
const res = await client.post('/vacaciones', { fecha_inicio, fecha_fin });
const res = await client.put(`/vacaciones/${id}`, { estatus_vacacion: 'Aprobado' });
```

---

## 🗃️ Prisma singleton (`server/src/prisma.ts`)

```typescript
// Instancia compartida de PrismaClient — importar SIEMPRE de aquí
// Evita múltiples conexiones a la BD
import { prisma } from '../prisma';

// ❌ NO hacer esto en ningún controller:
// const prisma = new PrismaClient();
```

---

## 🐳 Variables de entorno

### Backend (`server/.env`)

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | ✅ | Secreto para JWT (mínimo 32 caracteres) |
| `PORT` | — | Puerto del servidor (default: 4000) |
| `NODE_ENV` | — | `development` o `production` |
| `FRONTEND_URL` | — | URL del frontend para CORS en producción |
| `ADMIN_EMAIL` | — | Email del admin inicial (default: admin@erp.com) |
| `ADMIN_PASSWORD` | — | Contraseña del admin inicial (default: Admin1234!) |
| `DEFAULT_EMPLOYEE_PASSWORD` | — | Contraseña para nuevos empleados (default: Bienvenido1!) |

### Frontend (`.env`)

| Variable | Requerida | Descripción |
|---|---|---|
| `VITE_API_URL` | ✅ | URL del backend (default: http://localhost:4000) |
