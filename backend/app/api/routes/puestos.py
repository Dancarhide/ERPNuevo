from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empleados import Empleado, Puesto
from app.schemas.puestos import PuestoCreate, PuestoResponse, PuestoUpdate

router = APIRouter()


@router.get("", response_model=List[PuestoResponse])
async def read_puestos(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Get all puestos
    result = await session.execute(select(Puesto))
    puestos = list(result.scalars().all())

    # Get active employees count per puesto
    count_stmt = (
        select(Empleado.puesto_id, func.count(Empleado.id))
        .where(Empleado.estatus == "Activo", Empleado.es_sistema.is_(False))
        .group_by(Empleado.puesto_id)
    )
    count_result = await session.execute(count_stmt)
    counts: dict[int | None, int] = dict(count_result.all())

    for p in puestos:
        p.personal_actual = counts.get(int(p.id), 0)

    return puestos


@router.post("", response_model=PuestoResponse, status_code=status.HTTP_201_CREATED)
async def create_puesto(
    puesto_in: PuestoCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    new_puesto = Puesto(
        nombre_puesto=puesto_in.nombre_puesto,
        descripcion=puesto_in.descripcion,
        hierarchy_level=puesto_in.hierarchy_level,
        area_id=puesto_in.area_id,
        beneficios=puesto_in.beneficios,
        requisitos=puesto_in.requisitos,
        sueldo_min=puesto_in.sueldo_min,
        sueldo_max=puesto_in.sueldo_max,
        reporta_a_puesto_id=puesto_in.reporta_a_puesto_id,
        cupo_maximo=puesto_in.cupo_maximo,
    )
    session.add(new_puesto)
    await session.commit()
    await session.refresh(new_puesto)
    return new_puesto


@router.put("/{puesto_id}", response_model=PuestoResponse)
async def update_puesto(
    puesto_id: int,
    puesto_in: PuestoUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(Puesto).where(Puesto.id == puesto_id))
    puesto = result.scalar_one_or_none()
    if not puesto:
        raise HTTPException(status_code=404, detail="Puesto no encontrado")

    update_data = puesto_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(puesto, key, value)

    await session.commit()
    await session.refresh(puesto)
    return puesto


@router.delete("/{puesto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_puesto(
    puesto_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> None:
    result = await session.execute(select(Puesto).where(Puesto.id == puesto_id))
    puesto = result.scalar_one_or_none()
    if not puesto:
        raise HTTPException(status_code=404, detail="Puesto no encontrado")

    await session.delete(puesto)
    await session.commit()
