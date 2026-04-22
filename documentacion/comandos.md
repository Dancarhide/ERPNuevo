# Referencia de Comandos — ERP Sistema de Gestión

Guía rápida de todos los comandos disponibles en el proyecto.

---

## 📁 Desde la raíz del proyecto (`/ERPNuevo`)

### Desarrollo

| Comando | Descripción |
|---|---|
| `npm run dev:all` | ⭐ Levanta **frontend + backend** en paralelo con colores |
| `npm run dev` | Solo el frontend (Vite) en `http://localhost:5173` |
| `npm run dev:server` | Solo el backend (Express) en `http://localhost:4000` |

### Base de datos

| Comando | Descripción |
|---|---|
| `npm run setup:dev` | 🚀 **Setup completo desde cero**: instala deps + migrate + seed |
| `npm run setup:db` | Aplica migraciones + seed (sin reinstalar dependencias) |
| `npm run db:seed` | Corre solo el seed base (áreas, roles, permisos, admin) |
| `npm run db:reset` | ⚠️ **Borra toda la BD** y la recrea con migrations + seed |

### Build

| Comando | Descripción |
|---|---|
| `npm run build` | Compila el frontend para producción en `/dist` |
| `npm run preview` | Previsualiza el build de producción |

---

## 📁 Desde el servidor (`/ERPNuevo/server`)

### Desarrollo

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor Express con hot-reload |
| `npm run build` | Compila TypeScript a `/dist` |
| `npm run start` | Levanta el servidor desde el build compilado |

### Base de datos

| Comando | Descripción |
|---|---|
| `npm run db:migrate` | Aplica las migraciones pendientes a la BD |
| `npm run db:seed` | Crea datos base (áreas, roles, permisos, admin) |
| `npm run db:seed:demo` | Crea **5 empleados por rol** con datos de prueba |
| `npm run db:reset` | ⚠️ Borra y recrea la BD completa |
| `npm run db:push` | Empuja el schema a la BD sin crear migrations (solo dev) |
| `npm run setup` | `db:migrate` + `db:seed` en secuencia |

### Testing

| Comando | Descripción |
|---|---|
| `npm test` | Corre todos los tests de Jest |
| `npm run test:watch` | Corre los tests en modo watch |
| `npm run test:coverage` | Genera reporte de cobertura en `/coverage` |

### Calidad de código

| Comando | Descripción |
|---|---|
| `npm run lint` | Revisa errores de ESLint en `src/` |
| `npm run lint:fix` | Corrige automáticamente los errores de ESLint |
| `npm run format` | Formatea el código con Prettier |
| `npm run format:check` | Verifica el formato sin modificar archivos |

---

## 🐳 Docker

| Comando | Descripción |
|---|---|
| `docker compose up --build` | Levanta toda la app desde cero (BD + backend + frontend) |
| `docker compose up -d --build` | Igual pero en segundo plano |
| `docker compose down` | Detiene y elimina los contenedores |
| `docker compose down -v` | ⚠️ Detiene contenedores **y borra los volúmenes** (BD incluida) |
| `docker compose logs -f server` | Ver logs en tiempo real del backend |
| `docker compose logs -f db` | Ver logs en tiempo real de PostgreSQL |

---

## 🛠️ Prisma (desde `/server`)

| Comando | Descripción |
|---|---|
| `npx prisma studio` | Abre el explorador visual de la BD en el navegador |
| `npx prisma generate` | Regenera el cliente de Prisma (después de cambiar el schema) |
| `npx prisma migrate dev --name <nombre>` | Crea una nueva migración con el nombre dado |
| `npx prisma migrate deploy` | Aplica migraciones pendientes (para producción) |
| `npx prisma migrate reset --force` | ⚠️ Resetea la BD completa |
| `npx prisma db push` | Empuja cambios del schema sin crear archivo de migración |

---

## 🌱 Flujo recomendado: levantar desde cero

```bash
# 1. Clonar el repo
git clone <url>
cd ERPNuevo

# 2. Configurar variables de entorno
cp .env.example .env
cp server/.env.example server/.env
# Editar server/.env con tu DATABASE_URL

# 3. Setup completo (instala + migra + seed)
npm run setup:dev

# 4. Opcional: poblar con datos de prueba
cd server && npm run db:seed:demo && cd ..

# 5. Levantar el sistema
npm run dev:all
```

---

## ⚠️ Comandos destructivos (úsalos con cuidado)

| Comando | Efecto |
|---|---|
| `npm run db:reset` | Elimina **todos los datos** de la BD |
| `docker compose down -v` | Elimina los volúmenes Docker (BD permanente borrada) |
| `npx prisma migrate reset --force` | Resetea BD y vuelve a aplicar migrations |
