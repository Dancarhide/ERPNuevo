from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import RequirePermission, get_current_user
from app.core.database import get_db
from app.models.comunicacion import EventoEmpresa
from app.models.empleados import Empleado
from app.schemas.eventos import EventoCreate, EventoResponse, EventoUpdate

router = APIRouter()


@router.get("", response_model=List[EventoResponse])
async def list_eventos(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    """
    Listar todos los eventos. Abierto a todos los empleados.
    """
    result = await session.execute(select(EventoEmpresa))
    eventos = result.scalars().all()
    return eventos


@router.post("", response_model=EventoResponse)
async def create_evento(
    evento_in: EventoCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("gestionar_calendario"))],
) -> Any:
    """
    Crear un nuevo evento. Requiere permisos de gestionar calendario.
    """
    evento = EventoEmpresa(
        **evento_in.model_dump(),
        creado_por_id=current_user.id,
    )
    session.add(evento)
    await session.commit()
    await session.refresh(evento)
    return evento


@router.put("/{evento_id}", response_model=EventoResponse)
async def update_evento(
    evento_id: int,
    evento_in: EventoUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("gestionar_calendario"))],
) -> Any:
    """
    Actualizar un evento. Requiere permisos.
    """
    result = await session.execute(select(EventoEmpresa).where(EventoEmpresa.id == evento_id))
    evento = result.scalar_one_or_none()

    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    update_data = evento_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(evento, key, value)

    session.add(evento)
    await session.commit()
    await session.refresh(evento)
    return evento


@router.delete("/{evento_id}")
async def delete_evento(
    evento_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("gestionar_calendario"))],
) -> Any:
    """
    Eliminar un evento. Requiere permisos.
    """
    result = await session.execute(select(EventoEmpresa).where(EventoEmpresa.id == evento_id))
    evento = result.scalar_one_or_none()

    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    await session.delete(evento)
    await session.commit()
    return {"ok": True, "message": "Evento eliminado exitosamente"}
