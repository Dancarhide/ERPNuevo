import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import (
    areas,
    asistencias,
    auth,
    candidatos,
    chat,
    clima,
    dashboard,
    dispositivos,
    empleados,
    empresa,
    evaluaciones,
    eventos,
    incidencias,
    kpis,
    nomina,
    notificaciones,
    organigrama,
    parametros_fiscales,
    puestos,
    roles,
    tareas,
    vacaciones,
    vacantes,
)
from app.core.config import settings
from app.core.scheduler import start_scheduler

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Ensure uploads dir exists and mount it
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(areas.router, prefix="/api/areas", tags=["areas"])
app.include_router(puestos.router, prefix="/api/puestos", tags=["puestos"])
app.include_router(empleados.router, prefix="/api/empleados", tags=["empleados"])
app.include_router(organigrama.router, prefix="/api/organigrama", tags=["organigrama"])
app.include_router(vacaciones.router, prefix="/api/vacaciones", tags=["vacaciones"])
app.include_router(asistencias.router, prefix="/api/asistencias", tags=["asistencias"])
app.include_router(roles.router, prefix="/api/roles", tags=["roles"])
app.include_router(dispositivos.router, prefix="/api/dispositivos", tags=["dispositivos"])
app.include_router(empresa.router, prefix="/api/empresa", tags=["empresa"])
app.include_router(kpis.router, prefix="/api/kpis", tags=["kpis"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(nomina.router, prefix="/api/nomina", tags=["nomina"])
app.include_router(
    parametros_fiscales.router, prefix="/api/parametros_fiscales", tags=["parametros_fiscales"]
)
app.include_router(incidencias.router, prefix="/api/incidencias", tags=["incidencias"])
app.include_router(notificaciones.router, prefix="/api/notificaciones", tags=["notificaciones"])
app.include_router(tareas.router, prefix="/api/tareas", tags=["tareas"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(vacantes.router, prefix="/api/vacantes", tags=["vacantes"])
app.include_router(candidatos.router, prefix="/api/candidatos", tags=["candidatos"])
app.include_router(evaluaciones.router, prefix="/api/evaluaciones-desempeno", tags=["evaluaciones"])
app.include_router(clima.router, prefix="/api/clima", tags=["clima"])
app.include_router(eventos.router, prefix="/api/eventos", tags=["eventos"])

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def startup_event() -> None:
    start_scheduler()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to ERP API"}
