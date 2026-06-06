from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.asistencia import Vacacion
from app.models.empleados import Empleado
from app.schemas.vacaciones import VacacionCreate, VacacionResponse, VacacionUpdate

router = APIRouter()


@router.get("", response_model=list[VacacionResponse])
async def get_vacaciones(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
    empleado_id: int | None = None,
) -> Any:
    query = select(Vacacion).options(selectinload(Vacacion.empleado))
    if empleado_id:
        query = query.where(Vacacion.empleado_id == empleado_id)

    result = await session.execute(query)
    vacaciones = result.scalars().all()

    respuestas = []
    for v in vacaciones:
        resp = VacacionResponse.model_validate(v)
        resp.empleado_nombre = str(v.empleado.nombre_completo) if v.empleado else "Desconocido"
        respuestas.append(resp)

    return respuestas


@router.post("", response_model=VacacionResponse)
async def create_vacacion(
    vacacion_in: VacacionCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Validate employee exists
    result = await session.execute(select(Empleado).where(Empleado.id == vacacion_in.empleado_id))
    empleado = result.scalar_one_or_none()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    new_vacacion = Vacacion(
        empleado_id=vacacion_in.empleado_id,
        fecha_inicio=vacacion_in.fecha_inicio,
        fecha_fin=vacacion_in.fecha_fin,
        tipo_solicitud=vacacion_in.tipo_solicitud,
        motivo=vacacion_in.motivo,
        estatus_vacacion="Pendiente",
    )
    session.add(new_vacacion)
    await session.commit()
    await session.refresh(new_vacacion)

    resp = VacacionResponse.model_validate(new_vacacion)
    resp.empleado_nombre = str(empleado.nombre_completo)
    return resp


@router.patch("/{vacacion_id}/status", response_model=VacacionResponse)
async def update_vacacion_status(
    vacacion_id: int,
    status_update: VacacionUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(
        select(Vacacion).options(selectinload(Vacacion.empleado)).where(Vacacion.id == vacacion_id)
    )
    vacacion = result.scalar_one_or_none()

    if not vacacion:
        raise HTTPException(status_code=404, detail="Vacación no encontrada")

    vacacion.estatus_vacacion = status_update.estatus_vacacion  # type: ignore[assignment]
    if status_update.motivo_rechazo:
        vacacion.motivo_rechazo = status_update.motivo_rechazo  # type: ignore[assignment]

    session.add(vacacion)
    await session.commit()
    await session.refresh(vacacion)

    resp = VacacionResponse.model_validate(vacacion)
    resp.empleado_nombre = (
        str(vacacion.empleado.nombre_completo) if vacacion.empleado else "Desconocido"
    )
    return resp
