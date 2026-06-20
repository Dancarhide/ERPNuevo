from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import RequirePermission
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.parametros_fiscales import PoliticaVacacional
from app.schemas.politicas_vacacionales import (
    PoliticaVacacionalCreate,
    PoliticaVacacionalResponse,
    PoliticaVacacionalUpdate,
)

router = APIRouter()


@router.get("", response_model=List[PoliticaVacacionalResponse])
async def get_politicas(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    res = await session.execute(
        select(PoliticaVacacional).order_by(PoliticaVacacional.anios_desde.asc())
    )
    return res.scalars().all()


@router.post("", response_model=PoliticaVacacionalResponse, status_code=status.HTTP_201_CREATED)
async def create_politica(
    data: PoliticaVacacionalCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("editar_configuracion"))],
):
    nueva_politica = PoliticaVacacional(**data.model_dump())
    session.add(nueva_politica)
    await session.commit()
    await session.refresh(nueva_politica)
    return nueva_politica


@router.put("/{politica_id}", response_model=PoliticaVacacionalResponse)
async def update_politica(
    politica_id: int,
    data: PoliticaVacacionalUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("editar_configuracion"))],
):
    res = await session.execute(
        select(PoliticaVacacional).where(PoliticaVacacional.id == politica_id)
    )
    politica = res.scalar_one_or_none()
    if not politica:
        raise HTTPException(status_code=404, detail="Política no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(politica, k, v)

    await session.commit()
    await session.refresh(politica)
    return politica


@router.delete("/{politica_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_politica(
    politica_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("editar_configuracion"))],
):
    res = await session.execute(
        select(PoliticaVacacional).where(PoliticaVacacional.id == politica_id)
    )
    politica = res.scalar_one_or_none()
    if not politica:
        raise HTTPException(status_code=404, detail="Política no encontrada")

    await session.delete(politica)
    await session.commit()
