# Guia del Desarrollador: ERP Contable y Nomina

Este documento establece las normativas, arquitectura y convenciones para mantener y escalar el ERP en el futuro. 

## 1. Arquitectura Base
El proyecto sigue una arquitectura de cliente-servidor desacoplada.

*   **Backend:** Construido sobre Python 3.11+ utilizando FastAPI.
*   **Frontend:** Construido con React y Next.js (App Router).
*   **Base de Datos:** PostgreSQL 16 (Relacional).
*   **Cache y Pub/Sub:** Redis 7 (Manejo de estados en tiempo real).

## 2. Convenciones de Backend

### 2.1. Gestor de Paquetes (UV)
El proyecto utiliza `uv` en lugar de `pip` o `poetry` por sus beneficios en velocidad de resolucion.
Para agregar nuevas dependencias de produccion:
`uv add nombre_paquete`
Para dependencias de desarrollo:
`uv add --dev nombre_paquete`

### 2.2. Base de Datos y ORM (SQLAlchemy 2.0)
Se utiliza SQLAlchemy en su version 2.0 con soporte asincrono (`asyncpg`).
*   Los modelos deben definirse en `backend/app/models/`.
*   Todos los modelos deben heredar de `Base` en `base.py`.
*   Existe un sistema de Auditoria interceptado. Cualquier cambio (INSERT, UPDATE, DELETE) en tablas especificas generara un registro automatico en `auditoria_logs`. No es necesario auditar a mano.

### 2.3. Migraciones (Alembic)
Al realizar cambios en los modelos, se debe generar la migracion correspondiente:
`uv run alembic revision --autogenerate -m "descripcion_del_cambio"`
Y aplicarla localmente:
`uv run alembic upgrade head`

### 2.4. WebSockets y Tiempo Real
La comunicacion asincrona se rige bajo Redis Pub/Sub. No se debe guardar estado de WebSockets localmente si se planea escalar horizontalmente. Usar la clase `ConnectionManager` ubicada en `backend/app/api/websockets/connection_manager.py` para emitir mensajes.

### 2.5. Calidad de Codigo
Se exige el uso de tipado estricto. Antes de cada commit, el codigo es evaluado por `ruff`.
Para auto-corregir problemas:
`uv run ruff check --fix`
`uv run ruff format`

## 3. Convenciones de Frontend

### 3.1. Gestor de Paquetes (PNPM)
Se utiliza `pnpm` por su manejo eficiente de cache global y workspaces (si aplicara).
Comando para instalacion: `pnpm install`

### 3.2. Estructura de Next.js
El sistema emplea la arquitectura App Router de Next.js (directorio `src/app/`).
*   Los componentes reutilizables deben residir en `src/components/`.
*   Las interfaces TypeScript deben colocarse en `src/types/`.
*   La logica de interaccion con la API se encuentra en `src/lib/api.ts` o directorios de servicios similares.

### 3.3. Modo Standalone
Para optimizacion de tamano en contenedores de produccion, Next.js esta configurado en modo "standalone" mediante `next.config.ts`. Esto permite generar un build que incluye unicamente las dependencias y archivos necesarios para produccion, resultando en imagenes Docker mas ligeras.

### 3.4. Calidad de Codigo
Se utilizan las reglas estrictas de ESLint y el compilador de TypeScript (`tsc --noEmit`). Se debe resolver cualquier advertencia generada por:
`pnpm run lint`
`pnpm run typecheck`
