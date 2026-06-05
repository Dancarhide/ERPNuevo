from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import areas, auth, empleados, organigrama, puestos
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(areas.router, prefix="/api/areas", tags=["areas"])
app.include_router(puestos.router, prefix="/api/puestos", tags=["puestos"])
app.include_router(empleados.router, prefix="/api/empleados", tags=["empleados"])
app.include_router(organigrama.router, prefix="/api/organigrama", tags=["organigrama"])

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to ERP API"}
