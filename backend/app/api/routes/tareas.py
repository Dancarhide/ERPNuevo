from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.comunicacion import Tarea
from app.models.empleados import Empleado
from app.schemas.tareas import TareaCreate, TareaResponse, TareaUpdate
from app.services.notificaciones_service import crear_notificacion

router = APIRouter()


@router.get("", response_model=List[TareaResponse])
async def get_tareas(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Retorna las tareas del usuario actual
    result = await session.execute(
        select(Tarea)
        .where(Tarea.empleado_id == current_user.id)
        .order_by(Tarea.completada.asc(), Tarea.fecha_vencimiento.asc(), Tarea.id.desc())
    )
    return result.scalars().all()


@router.post("", response_model=TareaResponse)
async def create_tarea(
    tarea_in: TareaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    nueva_tarea = Tarea(
        **tarea_in.model_dump(), empleado_id=current_user.id, asignado_por_id=current_user.id
    )
    session.add(nueva_tarea)
    await session.commit()
    await session.refresh(nueva_tarea)

    # Solo notificar si la tarea fue asignada por alguien más
    if nueva_tarea.empleado_id != current_user.id:
        await crear_notificacion(
            session=session,
            empleado_id=nueva_tarea.empleado_id,
            titulo="Nueva Tarea Asignada",
            mensaje=f"Te han asignado la tarea: {nueva_tarea.titulo}",
            tipo="tareas",
        )
    return nueva_tarea


@router.put("/{id}", response_model=TareaResponse)
async def update_tarea(
    id: int,
    tarea_in: TareaUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(
        select(Tarea).where(Tarea.id == id, Tarea.empleado_id == current_user.id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    update_data = tarea_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tarea, field, value)

    session.add(tarea)
    await session.commit()
    await session.refresh(tarea)
    return tarea


@router.delete("/{id}")
async def delete_tarea(
    id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(
        select(Tarea).where(Tarea.id == id, Tarea.empleado_id == current_user.id)
    )
    tarea = result.scalar_one_or_none()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    await session.delete(tarea)
    await session.commit()
    return {"message": "Tarea eliminada exitosamente"}
