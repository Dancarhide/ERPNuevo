from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import RequirePermission, get_current_user
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.empresa import InfoEmpresa
from app.schemas.empresa import InfoEmpresaResponse, InfoEmpresaUpdate

router = APIRouter()


@router.get("/info", response_model=InfoEmpresaResponse)
async def get_info_empresa(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    """
    Obtener la información de la empresa.
    Si no existe, la crea con campos vacíos y la devuelve.
    """
    result = await session.execute(select(InfoEmpresa).limit(1))
    info = result.scalar_one_or_none()

    if not info:
        info = InfoEmpresa(valores=[])
        session.add(info)
        await session.commit()
        await session.refresh(info)

    return info


@router.put("/info", response_model=InfoEmpresaResponse)
async def update_info_empresa(
    info_in: InfoEmpresaUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("configurar_empresa"))],
) -> Any:
    """
    Actualizar la información de la empresa. Requiere permisos de administrador.
    """
    result = await session.execute(select(InfoEmpresa).limit(1))
    info = result.scalar_one_or_none()

    if not info:
        info = InfoEmpresa(**info_in.model_dump(exclude_unset=True))
        session.add(info)
    else:
        update_data = info_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(info, key, value)
        session.add(info)

    await session.commit()
    await session.refresh(info)
    return info
