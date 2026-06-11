from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.talento import Candidato
from app.schemas.talento import Candidato as CandidatoSchema
from app.schemas.talento import CandidatoCreate, CandidatoUpdateStatus

router = APIRouter()


@router.get("", response_model=List[CandidatoSchema])
async def get_candidatos(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(Candidato))
    return result.scalars().all()


@router.post("", response_model=CandidatoSchema, status_code=status.HTTP_201_CREATED)
async def create_candidato(
    candidato: CandidatoCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    db_candidato = Candidato(
        nombre_completo=candidato.nombre_completo,
        email=candidato.email,
        telefono=candidato.telefono,
        cv_url=candidato.cv_url,
        vacante_id=candidato.idvacante,
        puesto_id=candidato.idpuesto,
        estatus=candidato.estatus,
        notas=candidato.notas,
    )
    session.add(db_candidato)
    await session.commit()
    await session.refresh(db_candidato)
    return db_candidato


@router.put("/{id}/status")
async def update_candidato_status(
    id: int,
    status_update: CandidatoUpdateStatus,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(Candidato).where(Candidato.id == id))
    candidato_db = result.scalar_one_or_none()
    if not candidato_db:
        raise HTTPException(status_code=404, detail="Candidato no encontrado")

    candidato_db.estatus = status_update.estatus
    await session.commit()
    return {"message": "Status updated"}


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidato(
    id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> None:
    result = await session.execute(select(Candidato).where(Candidato.id == id))
    candidato_db = result.scalar_one_or_none()
    if not candidato_db:
        raise HTTPException(status_code=404, detail="Candidato no encontrado")

    await session.delete(candidato_db)
    await session.commit()
