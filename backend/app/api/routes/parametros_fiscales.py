from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import RequirePermission
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.parametros_fiscales import ParametroFiscal
from app.schemas.parametros_fiscales import (
    ParametrosFiscalesCreate,
    ParametrosFiscalesResponse,
    ParametrosFiscalesUpdate,
)

router = APIRouter()


@router.get("", response_model=List[ParametrosFiscalesResponse])
async def get_parametros_fiscales(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    """Obtiene todos los años de configuración fiscal"""
    res = await session.execute(select(ParametroFiscal).order_by(ParametroFiscal.ejercicio.desc()))
    return res.scalars().all()


@router.post("", response_model=ParametrosFiscalesResponse, status_code=status.HTTP_201_CREATED)
async def create_parametro_fiscal(
    data: ParametrosFiscalesCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("editar_configuracion"))],
):
    """Crea una configuración fiscal para un nuevo ejercicio"""
    res = await session.execute(
        select(ParametroFiscal).where(ParametroFiscal.ejercicio == data.ejercicio)
    )
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe configuración para el ejercicio {data.ejercicio}",
        )

    nuevo_parametro = ParametroFiscal(**data.model_dump())
    session.add(nuevo_parametro)
    await session.commit()
    await session.refresh(nuevo_parametro)
    return nuevo_parametro


@router.put("/{param_id}", response_model=ParametrosFiscalesResponse)
async def update_parametro_fiscal(
    param_id: int,
    data: ParametrosFiscalesUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("editar_configuracion"))],
):
    res = await session.execute(select(ParametroFiscal).where(ParametroFiscal.id == param_id))
    parametro = res.scalar_one_or_none()
    if not parametro:
        raise HTTPException(status_code=404, detail="Parámetros no encontrados")

    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(parametro, k, v)

    await session.commit()
    await session.refresh(parametro)
    return parametro
