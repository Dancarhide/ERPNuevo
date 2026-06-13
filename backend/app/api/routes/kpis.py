from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import RequirePermission
from app.core.database import get_db
from app.models.asistencia import Incidencia
from app.models.empleados import Area, Empleado
from app.schemas.kpis import (
    ChartDataPoint,
    HeadcountKPIResponse,
    IncidenciasKPIResponse,
    PayrollKPIResponse,
)

router = APIRouter()


@router.get("/headcount", response_model=HeadcountKPIResponse)
async def get_headcount_kpis(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    # Total activos
    res_total = await session.execute(
        select(func.count(Empleado.id)).where(
            Empleado.estatus == "Activo", Empleado.es_sistema.is_(False)
        )
    )
    total_activos = res_total.scalar_one_or_none() or 0

    # Por Género
    res_genero = await session.execute(
        select(Empleado.sexo, func.count(Empleado.id))
        .where(Empleado.estatus == "Activo", Empleado.es_sistema.is_(False))
        .group_by(Empleado.sexo)
    )
    por_genero = [
        ChartDataPoint(name=row[0] if row[0] else "No Especificado", value=row[1])
        for row in res_genero.all()
    ]

    # Por Área
    res_area = await session.execute(
        select(Area.nombre_area, func.count(Empleado.id))
        .outerjoin(Area, Empleado.area_id == Area.id)
        .where(Empleado.estatus == "Activo", Empleado.es_sistema.is_(False))
        .group_by(Area.nombre_area)
    )
    por_area = [
        ChartDataPoint(name=row[0] if row[0] else "Sin Área", value=row[1])
        for row in res_area.all()
    ]

    # Antigüedad promedio en años (calculado en Python para agnósticidad de DB)
    res_fechas = await session.execute(
        select(Empleado.fecha_ingreso).where(
            Empleado.estatus == "Activo",
            Empleado.fecha_ingreso.isnot(None),
            Empleado.es_sistema.is_(False),
        )
    )
    fechas = res_fechas.scalars().all()

    hoy = date.today()
    total_anios = 0
    for f in fechas:
        dias = (hoy - f).days
        total_anios += dias / 365.25

    antiguedad_promedio = round(total_anios / len(fechas), 1) if fechas else 0.0

    return HeadcountKPIResponse(
        total_activos=total_activos,
        antiguedad_promedio_anios=antiguedad_promedio,
        por_genero=por_genero,
        por_area=por_area,
    )


@router.get("/payroll", response_model=PayrollKPIResponse)
async def get_payroll_kpis(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    # Nómina Total
    res_nomina = await session.execute(
        select(func.sum(Empleado.sueldo)).where(
            Empleado.estatus == "Activo", Empleado.es_sistema.is_(False)
        )
    )
    nomina_total = res_nomina.scalar_one_or_none() or 0.0

    # Sueldo Promedio por Área
    res_avg = await session.execute(
        select(Area.nombre_area, func.avg(Empleado.sueldo))
        .outerjoin(Area, Empleado.area_id == Area.id)
        .where(Empleado.estatus == "Activo", Empleado.es_sistema.is_(False))
        .group_by(Area.nombre_area)
    )

    sueldo_promedio_area = [
        ChartDataPoint(name=row[0] if row[0] else "Sin Área", value=float(row[1] or 0))
        for row in res_avg.all()
    ]

    return PayrollKPIResponse(
        nomina_mensual_total=float(nomina_total),
        sueldo_promedio_area=sueldo_promedio_area,
    )


@router.get("/incidencias", response_model=IncidenciasKPIResponse)
async def get_incidencias_kpis(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
):
    # Total activas (Pendientes)
    res_total = await session.execute(
        select(func.count(Incidencia.id)).where(Incidencia.estatus == "Pendiente")
    )
    total_activas = res_total.scalar_one_or_none() or 0

    # Por Estatus
    res_estatus = await session.execute(
        select(Incidencia.estatus, func.count(Incidencia.id)).group_by(Incidencia.estatus)
    )

    por_estatus = [
        ChartDataPoint(name=row[0] if row[0] else "Desconocido", value=row[1])
        for row in res_estatus.all()
    ]

    return IncidenciasKPIResponse(
        total_activas=total_activas,
        por_estatus=por_estatus,
    )
