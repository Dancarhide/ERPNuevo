from typing import Annotated, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import RequirePermission
from app.api.websockets.connection_manager import manager
from app.core.database import get_db
from app.models.asistencia import Incidencia
from app.models.comunicacion import Notificacion
from app.models.empleados import Empleado
from app.schemas.incidencias import IncidenciaCreate, IncidenciaResponse, IncidenciaUpdate

router = APIRouter()


async def create_notification(
    session: AsyncSession, empleado_id: int, titulo: str, mensaje: str, tipo: str = "incidencia"
):
    # 1. Guardar en BD
    notif = Notificacion(
        empleado_id=empleado_id,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        link="/dashboard/incidencias",
    )
    session.add(notif)
    await session.flush()

    # 2. Enviar por WebSocket al empleado (si está conectado)
    await manager.send_personal_message(
        {
            "type": "notification",
            "payload": {
                "id": notif.id,
                "titulo": notif.titulo,
                "mensaje": notif.mensaje,
                "tipo": notif.tipo,
                "leida": False,
                "creado_en": str(notif.creado_en) if notif.creado_en else None,
                "link": notif.link,
            },
        },
        empleado_id,
    )


@router.get("", response_model=List[IncidenciaResponse])
async def get_incidencias(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_incidencias"))],
    estatus: Optional[str] = None,
) -> Any:
    query = select(Incidencia).options(
        selectinload(Incidencia.empleado_reportado), selectinload(Incidencia.reportante)
    )

    # Si no tiene permiso de gestionar (RH), solo ve las propias
    from app.models.seguridad import Permiso, RolPermiso

    # Verificamos si tiene "gestionar_incidencias"
    # Este es un chequeo rápido manual (podemos optimizarlo después)
    has_manage = False
    if current_user.rol_id:
        rp = await session.execute(
            select(RolPermiso)
            .join(Permiso)
            .where(
                RolPermiso.rol_id == current_user.rol_id, Permiso.slug == "gestionar_incidencias"
            )
        )
        if rp.scalar_one_or_none():
            has_manage = True

    if not has_manage:
        query = query.where(
            or_(
                Incidencia.reportante_id == current_user.id,
                Incidencia.empleado_reportado_id == current_user.id,
            )
        )

    if estatus:
        query = query.where(Incidencia.estatus == estatus)

    query = query.order_by(Incidencia.creado_en.desc())
    result = await session.execute(query)
    return result.scalars().all()


@router.post("", response_model=IncidenciaResponse)
async def create_incidencia(
    incidencia_in: IncidenciaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("crear_incidencias"))],
) -> Any:
    # Validar reportado
    res_emp = await session.execute(
        select(Empleado).where(Empleado.id == incidencia_in.empleado_reportado_id)
    )
    if not res_emp.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Empleado reportado no encontrado")

    data = incidencia_in.model_dump()
    nueva_incidencia = Incidencia(**data, reportante_id=current_user.id)
    session.add(nueva_incidencia)
    await session.commit()
    await session.refresh(nueva_incidencia)

    # Crear notificación para el reportado
    await create_notification(
        session,
        empleado_id=nueva_incidencia.empleado_reportado_id,
        titulo="Nueva Incidencia",
        mensaje=f"Se ha levantado una incidencia ({nueva_incidencia.tipo}) a tu nombre.",
        tipo="incidencia",
    )
    await session.commit()

    # Recargar con relaciones
    res = await session.execute(
        select(Incidencia)
        .options(selectinload(Incidencia.empleado_reportado), selectinload(Incidencia.reportante))
        .where(Incidencia.id == nueva_incidencia.id)
    )
    return res.scalar_one()


@router.put("/{id}", response_model=IncidenciaResponse)
async def update_incidencia(
    id: int,
    incidencia_in: IncidenciaUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("gestionar_incidencias"))],
) -> Any:
    res = await session.execute(
        select(Incidencia)
        .options(selectinload(Incidencia.empleado_reportado), selectinload(Incidencia.reportante))
        .where(Incidencia.id == id)
    )
    incidencia = res.scalar_one_or_none()
    if not incidencia:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")

    data = incidencia_in.model_dump(exclude_unset=True)

    status_changed = False
    if "estatus" in data and data["estatus"] != incidencia.estatus:
        status_changed = True

    for field, value in data.items():
        setattr(incidencia, field, value)

    session.add(incidencia)

    if status_changed:
        await create_notification(
            session,
            empleado_id=incidencia.empleado_reportado_id,
            titulo="Actualización de Incidencia",
            mensaje=f"Tu incidencia ({incidencia.tipo}) ha cambiado a estatus: {incidencia.estatus}.",  # noqa: E501
            tipo="incidencia",
        )

    await session.commit()
    await session.refresh(incidencia)
    return incidencia


@router.delete("/{id}")
async def delete_incidencia(
    id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("gestionar_incidencias"))],
) -> Any:
    res = await session.execute(select(Incidencia).where(Incidencia.id == id))
    incidencia = res.scalar_one_or_none()
    if not incidencia:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")

    await session.delete(incidencia)
    await session.commit()
    return {"message": "Incidencia eliminada exitosamente"}
