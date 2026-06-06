from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    areas,
    asistencias,
    auth,
    dispositivos,
    empleados,
    organigrama,
    puestos,
    roles,
    vacaciones,
)
from app.core.config import settings
from app.core.scheduler import start_scheduler

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(areas.router, prefix="/api/areas", tags=["areas"])
app.include_router(puestos.router, prefix="/api/puestos", tags=["puestos"])
app.include_router(empleados.router, prefix="/api/empleados", tags=["empleados"])
app.include_router(organigrama.router, prefix="/api/organigrama", tags=["organigrama"])
app.include_router(vacaciones.router, prefix="/api/vacaciones", tags=["vacaciones"])
app.include_router(asistencias.router, prefix="/api/asistencias", tags=["asistencias"])
app.include_router(roles.router, prefix="/api/roles", tags=["roles"])
app.include_router(dispositivos.router, prefix="/api/dispositivos", tags=["dispositivos"])

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
