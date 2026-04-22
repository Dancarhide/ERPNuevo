# ERP Sistema de Gestión de Capital Humano

Sistema ERP completo para la gestión de personal, nómina, vacaciones, reclutamiento e indicadores organizacionales. Construido con React + Express + PostgreSQL.

## Módulos

| Módulo | Descripción |
|---|---|
| **Empleados** | CRUD completo, expediente digital, foto, datos fiscales |
| **Nómina** | Generación por quincena, timbrado SAT (simulado), PDFs y XMLs |
| **Vacaciones** | Solicitudes, aprobación/rechazo, descuento automático de días |
| **Reclutamiento (CyI)** | Pipeline de candidatos, vacantes, proceso de inducción |
| **Roles y Permisos** | RBAC dinámico configurable desde la interfaz |
| **Incidencias** | Registro de faltas, retardos y permisos |
| **Encuestas de Clima** | Evaluaciones de clima laboral |
| **Dashboard** | KPIs y métricas del área de RRHH |
| **Organigrama** | Visualización interactiva de la estructura organizacional |
| **Chat** | Mensajería interna entre empleados |

---

## Requisitos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Node.js | 20+ | LTS recomendado |
| PostgreSQL | 16+ | O usar Docker (ver abajo) |
| npm | 10+ | Viene con Node |
| Docker | 24+ | Solo si usas el método Docker |

---

## Opción A — Levantar con Docker (recomendado) 🐳

No requiere PostgreSQL instalado localmente. Un solo comando levanta todo.

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd ERPNuevo
```

### 2. Crear el archivo de variables de entorno

```bash
# Crea el archivo .env para Docker Compose en la raíz del proyecto
cat > .env << 'EOF'
POSTGRES_USER=erp_user
POSTGRES_PASSWORD=MiPasswordSeguro123
POSTGRES_DB=ERP_def
JWT_SECRET=<genera-uno-con-openssl-rand-hex-32>
ADMIN_EMAIL=admin@erp.com
ADMIN_PASSWORD=Admin1234!
DEFAULT_EMPLOYEE_PASSWORD=Bienvenido1!
VITE_API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
EOF
```

> ⚠️ **IMPORTANTE**: Cambia `JWT_SECRET` y `ADMIN_PASSWORD` antes de usar en producción.

### 3. Levantar la aplicación

```bash
docker compose up --build
```

El sistema arranca en este orden automáticamente:
1. PostgreSQL inicia y espera a estar listo
2. El backend aplica las migraciones de Prisma
3. El backend ejecuta el seed (crea roles, permisos, admin)
4. El servidor Express empieza a escuchar en el puerto 4000
5. El frontend nginx sirve la app en el puerto 3000

### 4. Acceder al sistema

| Servicio | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:4000 |
| **Health check** | http://localhost:4000/api/ping |

**Credenciales iniciales:**
- Email: `admin@erp.com`
- Contraseña: la que pusiste en `ADMIN_PASSWORD`

---

## Opción B — Sin Docker (desarrollo local) 💻

### 1. Clonar e instalar

```bash
git clone <url-del-repo>
cd ERPNuevo
```

### 2. Configurar variables de entorno

```bash
# Frontend
cp .env.example .env
# Editar VITE_API_URL si el backend no corre en localhost:4000

# Backend
cp server/.env.example server/.env
# Editar DATABASE_URL con tu conexión de PostgreSQL
```

El formato de DATABASE_URL es:
```
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/ERP_def
```

### 3. Instalar dependencias, migrar y hacer seed (un solo comando)

```bash
npm run setup:dev
```

Este comando hace todo:
1. `npm install` (frontend)
2. `cd server && npm install` (backend)
3. `prisma migrate deploy` (aplica el schema a la BD)
4. `tsx prisma/seed.ts` (crea datos base: roles, permisos, admin)

### 4. Levantar el sistema en desarrollo

```bash
npm run dev:all
```

Levanta frontend y backend en paralelo con output identificado por colores.

O por separado:
```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
npm run dev:server
```

---

## Comandos útiles

| Comando | Descripción |
|---|---|
| `npm run dev:all` | Levanta frontend y backend en paralelo |
| `npm run setup:db` | Aplica migraciones y seed (sin reinstalar deps) |
| `npm run db:seed` | Solo corre el seed (idempotente) |
| `npm run db:reset` | Borra y recrea la BD con migraciones + seed |
| `cd server && npm test` | Corre los tests de Jest |

---

## Variables de entorno

### Backend (`server/.env`)

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | ✅ | — | Secreto para firmar los JWT (mín. 32 chars) |
| `PORT` | — | `4000` | Puerto del servidor |
| `NODE_ENV` | — | `development` | Entorno de ejecución |
| `FRONTEND_URL` | — | — | URL del frontend (para CORS en producción) |
| `ADMIN_EMAIL` | — | `admin@erp.com` | Email del usuario admin inicial |
| `ADMIN_PASSWORD` | — | `Admin1234!` | Contraseña del admin (¡cámbiala en producción!) |
| `DEFAULT_EMPLOYEE_PASSWORD` | — | `Bienvenido1!` | Contraseña inicial de nuevos empleados |

### Frontend (`.env`)

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `VITE_API_URL` | ✅ | `http://localhost:4000` | URL del backend API |

---

## Datos iniciales (Seed)

Al correr el seed por primera vez se crean automáticamente:

**5 Áreas**: Dirección General, Recursos Humanos, Administración y Finanzas, Operaciones y Producción, Tecnología y Sistemas

**7 Roles del sistema**:

| Rol | Acceso |
|---|---|
| Admin | Total |
| RH | Empleados, vacaciones, reclutamiento |
| Directivo | Dashboard, reportes, KPIs |
| Jefe de Area | Sus empleados y organigrama |
| Contador | Nóminas y reportes fiscales |
| Empleado Normal | Mis nóminas, vacaciones e incidencias |
| Externo | Configurable por el admin |

**22 Permisos** distribuidos por módulo y asignados a roles según jerarquía

**10 Conceptos de nómina estándar** (percepciones y deducciones)

**Días festivos oficiales de México** para el año actual y siguiente

**1 Usuario Administrador** con email y contraseña configurables

---

## Arquitectura

```
ERPNuevo/
├── src/                    # Frontend React + TypeScript
│   ├── views/              # Páginas/vistas principales
│   ├── components/         # Componentes reutilizables
│   └── utils/              # Utilidades (permisos, formateo)
├── server/
│   ├── src/
│   │   ├── Controllers/    # Controladores HTTP
│   │   ├── Services/       # Lógica de negocio
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Definición de rutas API
│   │   └── middleware/     # Auth, RBAC, rate limiting
│   └── prisma/
│       ├── schema.prisma   # Schema de la base de datos
│       ├── seed.ts         # Script de datos iniciales
│       └── migrations/     # Historial de migraciones
├── docker-compose.yml      # Stack completo en Docker
├── Dockerfile              # Frontend (nginx)
└── server/Dockerfile       # Backend (Express)
```

---

## Despliegue en producción

### Render (Backend) + Vercel (Frontend)

1. **Base de datos**: Crea una instancia en [Neon](https://neon.tech) o [Supabase](https://supabase.com) y copia la `DATABASE_URL`.

2. **Backend en Render**:
   - Build command: `npm install && npm run build`
   - Start command: `npm run setup && npm start`
   - Variables de entorno: todas las del `server/.env.example`

3. **Frontend en Vercel**:
   - Framework: Vite
   - Build command: `npm run build`
   - Variable: `VITE_API_URL=https://tu-backend.onrender.com`

### Docker en servidor propio / VPS

```bash
git clone <repo>
cd ERPNuevo
cp .env.example .env  # editar valores
docker compose up -d --build
```

---

## Tecnologías

**Frontend**: React 19, TypeScript, Vite, React Router 7, Recharts, FullCalendar, jsPDF

**Backend**: Express 4, TypeScript, Prisma 6, PostgreSQL, JWT, bcrypt, Helmet, express-rate-limit

**DevOps**: Docker, Docker Compose, nginx, GitHub Actions (por configurar)
