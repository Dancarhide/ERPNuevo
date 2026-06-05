# Guía de Comandos y Herramientas (ERP Nuevo)

Este documento contiene todos los comandos necesarios para ejecutar, validar y formatear el código tanto en el Frontend como en el Backend.

---

## 🐍 Backend (Python / FastAPI)

Ubicación: Carpeta `backend/`
Herramienta de gestión: `uv` (reemplaza a pip/venv).

### Ejecutar el Servidor de Desarrollo
Para correr el backend con recarga automática al guardar (Hot Reload):
```bash
cd backend
uv run fastapi dev app/main.py
```
*(Nota: Si el comando `fastapi dev` no se reconoce, usa: `uv run uvicorn app.main:app --reload`)*

### Validar y Formatear Código (Linting & Formatting)
Usamos **Ruff** (linter/formatter ultrarrápido) y **Mypy** (tipado estricto).

```bash
cd backend
uv run ruff check .          # Verifica errores de estilo e importaciones (Lint)
uv run ruff check . --fix    # Corrige errores automáticamente
uv run ruff format .         # Formatea el código a PEP8
uv run mypy app/             # Verifica que no haya errores de tipado (Type Check)
```

### Migraciones de Base de Datos (Alembic)
```bash
cd backend
uv run alembic revision --autogenerate -m "nombre_de_la_migracion"
uv run alembic upgrade head
```

---

## ⚛️ Frontend (Next.js / React)

Ubicación: Carpeta `frontend/`
Herramienta de gestión: `pnpm`.

### Ejecutar el Servidor de Desarrollo
Para correr el frontend localmente (se abrirá en `http://localhost:3000`):
```bash
cd frontend
pnpm run dev
```

### Validar y Formatear Código
Usamos **ESLint** (reglas de React/JS), **Prettier** (estilo visual del código) y **TypeScript** (tipado).

```bash
cd frontend
pnpm run lint         # Encuentra errores de ESLint
pnpm run format       # Formatea el código con Prettier
pnpm run typecheck    # Verifica errores de tipos TypeScript
```

---

## 🛡️ Pre-commit Hooks (Husky + Lint-Staged)

Se ha configurado un **Git Pre-commit Hook**. Esto significa que **antes de cada commit**, el sistema automáticamente:
1. Formateará y revisará (Lint) los archivos de Python con `ruff` y `mypy`.
2. Formateará y revisará (Lint) los archivos de TS/JS con `prettier` y `eslint`.

**Si el código tiene errores de tipado o de estilo que no se puedan auto-corregir, el commit fallará** y te indicará qué debes arreglar. Esto garantiza que NUNCA subas código roto o desordenado al repositorio.

Si en algún momento necesitas saltarte esta validación (no recomendado), puedes hacer el commit con el flag `--no-verify`:
```bash
git commit -m "Mensaje" --no-verify
```
