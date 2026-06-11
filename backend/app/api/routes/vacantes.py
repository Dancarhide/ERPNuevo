from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.talento import Vacante
from app.schemas.talento import Vacante as VacanteSchema
from app.schemas.talento import VacanteCreate

router = APIRouter()


@router.get("", response_model=List[VacanteSchema])
async def get_vacantes(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(Vacante))
    return result.scalars().all()


@router.post("", response_model=VacanteSchema, status_code=status.HTTP_201_CREATED)
async def create_vacante(
    vacante: VacanteCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    db_vacante = Vacante(
        titulo=vacante.titulo,
        descripcion=vacante.descripcion,
        area_id=vacante.idarea,
        puesto_id=vacante.idpuesto,
        cantidad_solicitada=vacante.cantidad_solicitada,
        cantidad_contratada=vacante.cantidad_contratada,
        estatus=vacante.estatus,
    )
    session.add(db_vacante)
    await session.commit()
    await session.refresh(db_vacante)
    return db_vacante
