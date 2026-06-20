from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.asistencia import Vacacion
from app.models.empleados import Empleado
from app.schemas.vacaciones import (
    VacacionCreate,
    VacacionResponse,
    VacacionStatsResponse,
    VacacionUpdate,
)
from app.services.notificaciones_service import crear_notificacion

router = APIRouter()


@router.get("/stats/me", response_model=VacacionStatsResponse)
async def get_my_vacation_stats(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    total_ganados = 12
    if current_user.fecha_ingreso:
        today = date.today()
        antiguedad_anios = (
            today.year
            - current_user.fecha_ingreso.year
            - (
                (today.month, today.day)
                < (current_user.fecha_ingreso.month, current_user.fecha_ingreso.day)
            )
        )
        if antiguedad_anios < 1:
            antiguedad_anios = 1

        from app.models.parametros_fiscales import PoliticaVacacional

        query_pol = select(PoliticaVacacional).where(
            PoliticaVacacional.anios_desde <= antiguedad_anios,
            PoliticaVacacional.anios_hasta >= antiguedad_anios,
            PoliticaVacacional.activo,
        )
        res_pol = await session.execute(query_pol)
        politica = res_pol.scalar_one_or_none()

        if politica:
            total_ganados = politica.dias_otorgados
        else:
            # Fallback for max years
            query_max = (
                select(PoliticaVacacional)
                .where(PoliticaVacacional.activo)
                .order_by(PoliticaVacacional.anios_hasta.desc())
                .limit(1)
            )
            res_max = await session.execute(query_max)
            politica_max = res_max.scalar_one_or_none()
            if politica_max and antiguedad_anios > politica_max.anios_hasta:
                total_ganados = politica_max.dias_otorgados

    query = select(Vacacion).where(Vacacion.empleado_id == current_user.id)
    result = await session.execute(query)
    vacaciones = result.scalars().all()

    taken = 0
    pending = 0

    for v in vacaciones:
        dias = (v.fecha_fin - v.fecha_inicio).days + 1
        if dias < 0:
            dias = 0

        if v.estatus_vacacion == "Aprobado":
            taken += dias
        elif v.estatus_vacacion == "Pendiente":
            pending += dias

    return VacacionStatsResponse(
        total=total_ganados, taken=taken, pending=pending, available=total_ganados - taken
    )


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

    # Enviar notificación al empleado
    estado_texto = "Aprobada" if status_update.estatus_vacacion == "Aprobado" else "Rechazada"
    await crear_notificacion(
        session=session,
        empleado_id=vacacion.empleado_id,
        titulo=f"Solicitud de Vacaciones {estado_texto}",
        mensaje=f"Tu solicitud del {vacacion.fecha_inicio} al {vacacion.fecha_fin} ha sido {estado_texto.lower()}.",  # noqa: E501
        tipo="vacaciones",
        link="/dashboard/mis-asistencias",
    )

    return resp
