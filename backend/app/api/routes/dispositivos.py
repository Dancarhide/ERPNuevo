import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import RequirePermission
from app.core.database import get_db
from app.models.checador import DispositivoBiometrico
from app.models.empleados import Empleado

router = APIRouter()


# Schemas
class DispositivoBase(BaseModel):
    nombre: str
    marca: str
    metodo_conexion: str
    ip_address: str | None = None
    puerto: int | None = None
    activo: bool = True


class DispositivoCreate(DispositivoBase):
    pass


class DispositivoUpdate(DispositivoBase):
    pass


class DispositivoResponse(DispositivoBase):
    id: int
    token_auth: str | None
    ultima_sincronizacion: datetime | None

    class Config:
        from_attributes = True


@router.get("", response_model=list[DispositivoResponse])
async def get_dispositivos(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
) -> Any:
    """Lista todos los dispositivos biométricos."""
    result = await session.execute(select(DispositivoBiometrico))
    return result.scalars().all()


@router.post("", response_model=DispositivoResponse)
async def create_dispositivo(
    data: DispositivoCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
) -> Any:
    """Crea un nuevo dispositivo y le genera un token único."""
    nuevo = DispositivoBiometrico(**data.model_dump())

    # Generar Token automáticamente para el Webhook (Push)
    if nuevo.metodo_conexion == "PUSH_WEBHOOK":
        nuevo.token_auth = str(uuid.uuid4())  # type: ignore

    session.add(nuevo)
    await session.commit()
    await session.refresh(nuevo)
    return nuevo


@router.delete("/{id}")
async def delete_dispositivo(
    id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
) -> Any:
    """Elimina un dispositivo."""
    result = await session.execute(
        select(DispositivoBiometrico).where(DispositivoBiometrico.id == id)
    )
    dispositivo = result.scalar_one_or_none()
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    await session.delete(dispositivo)
    await session.commit()
    return {"message": "Dispositivo eliminado"}


@router.post("/{id}/ping")
async def ping_dispositivo(
    id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
) -> Any:
    """Intenta hacer ping/conectar al dispositivo vía SDK (Modo Pasivo)."""
    result = await session.execute(
        select(DispositivoBiometrico).where(DispositivoBiometrico.id == id)
    )
    dispositivo = result.scalar_one_or_none()

    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    if dispositivo.metodo_conexion != "PULL_IP":
        raise HTTPException(status_code=400, detail="El dispositivo no está en modo PULL_IP")

    if not dispositivo.ip_address:
        raise HTTPException(status_code=400, detail="El dispositivo no tiene IP configurada")

    try:
        # Aquí intentamos la conexión con pyzk
        from zk import ZK

        zk = ZK(
            dispositivo.ip_address,
            port=dispositivo.puerto or 4370,
            timeout=5,
            password=0,
            force_udp=False,
            ommit_ping=False,
        )
        conn = None
        try:
            conn = zk.connect()
            conn.disable_device()
            # Prueba exitosa
            return {
                "status": "success",
                "message": f"Conexión exitosa al dispositivo {dispositivo.nombre}",
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"No se pudo conectar: {str(e)}")
        finally:
            if conn:
                conn.enable_device()
                conn.disconnect()
    except ImportError:
        raise HTTPException(status_code=500, detail="Librería ZK no instalada en el servidor")
