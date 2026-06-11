# Stratia (ERP Nuevo)

Bienvenido al repositorio de **Stratia**, el nuevo sistema ERP. Este proyecto está dividido en dos partes principales: un **Frontend** moderno construido con Next.js y un **Backend** robusto y rápido construido con FastAPI.

---

## 🛠️ Stack Tecnológico

**Frontend:**
- [Next.js](https://nextjs.org/) (React framework)
- [Tailwind CSS](https://tailwindcss.com/) (Estilos)
- [TypeScript](https://www.typescriptlang.org/)
- Herramienta de gestión de paquetes: `pnpm`

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) (Framework web en Python)
- [SQLAlchemy](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/) (ORM y migraciones)
- Base de datos: PostgreSQL (`asyncpg`)
- Herramienta de gestión y dependencias: `uv`

---

## 📋 Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado lo siguiente en tu sistema:
1. **Node.js** (v20 o superior recomendado)
2. **pnpm** (puedes instalarlo con `npm install -g pnpm`)
3. **Python** (v3.10 o superior)
4. **uv** (Gestor de paquetes y entornos de Python ultrarrápido)
5. **PostgreSQL** (Servidor de base de datos en ejecución)

---

## ⚙️ Instalación y Configuración

Sigue estos pasos para preparar tu entorno de desarrollo por primera vez:

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd ERPNuevo
```

### 2. Configuración del Backend
```bash
cd backend

# Instalar las dependencias de Python (uv creará el entorno virtual .venv automáticamente)
uv sync

# Crear un archivo de variables de entorno
cp .env.example .env # (Asegúrate de tener un .env creado y configurado)
```
> **Nota:** Abre el archivo `backend/.env` y asegúrate de que las credenciales de PostgreSQL (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) coincidan con tu servidor local.

### 3. Configuración del Frontend
```bash
cd ../frontend

# Instalar las dependencias de Node
pnpm install

# Crear un archivo de variables de entorno (por defecto se conecta a localhost:8000)
cp .env.example .env
```

### 4. Configurar Pre-commit Hooks (Recomendado)
Desde la raíz del proyecto (`ERPNuevo`), instala los hooks para validar el código antes de cada commit:
```bash
pnpm install
pnpm run prepare
```

---

## 🚀 Ejecución del Proyecto

### Iniciar el Backend (Servidor de Desarrollo)
Abre una terminal, sitúate en la carpeta `backend/` y ejecuta:
```bash
cd backend
uv run fastapi dev app/main.py
```
El backend estará disponible en: [http://localhost:8000](http://localhost:8000) (y la documentación Swagger en `/docs`).

### Iniciar el Frontend (Servidor de Desarrollo)
Abre otra terminal, sitúate en la carpeta `frontend/` y ejecuta:
```bash
cd frontend
pnpm run dev
```
El frontend estará disponible en: [http://localhost:3000](http://localhost:3000).

---

## 💻 Comandos Útiles para el Desarrollo

### 🐍 Backend (Python)
- **Verificar estilos (Linting):** `uv run ruff check .`
- **Corregir estilos automáticamente:** `uv run ruff check . --fix`
- **Formatear código:** `uv run ruff format .`
- **Verificar tipado estricto:** `uv run mypy app/`
- **Crear una nueva migración (BD):** `uv run alembic revision --autogenerate -m "nombre"`
- **Aplicar migraciones (BD):** `uv run alembic upgrade head`

### ⚛️ Frontend (Next.js)
- **Buscar errores de ESLint:** `pnpm run lint`
- **Formatear código:** `pnpm run format`
- **Verificar tipado de TypeScript:** `pnpm run typecheck`

---

## 🛡️ Pre-commit Hooks (Husky + Lint-Staged)

Este proyecto usa un **Git Pre-commit Hook**. Esto significa que **antes de cada commit**, el sistema automáticamente:
1. Formateará y revisará los archivos de Python con `ruff` y `mypy`.
2. Formateará y revisará los archivos de TS/JS con `prettier` y `eslint`.

Si el código tiene errores de tipado o estilo que no se puedan auto-corregir, el commit fallará para garantizar la calidad del repositorio.
