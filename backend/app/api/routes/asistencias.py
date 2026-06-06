from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import RequirePermission, get_current_user
from app.core.database import get_db
from app.models.asistencia import Asistencia, RegistroChecador
from app.models.empleados import Empleado
from app.schemas.asistencias import (
    AsistenciaCreate,
    AsistenciaResponse,
    AsistenciaUpdate,
    BulkAsistenciaRequest,
    RegistroChecadorCreate,
    RegistroChecadorResponse,
)

router = APIRouter()


@router.get("", response_model=list[AsistenciaResponse])
async def get_asistencias(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_asistencia"))],
    mes: int | None = None,
    year: int | None = None,
    idarea: int | None = None,
) -> Any:
    query = select(Asistencia).options(selectinload(Asistencia.empleado))

    if idarea is not None:
        query = query.join(Empleado).where(Empleado.area_id == idarea)

    result = await session.execute(query)
    asistencias = result.scalars().all()

    # Filter by month and year in memory for simplicity (since we use date field)
    # A more optimized approach would use DB functions like EXTRACT(MONTH FROM fecha)
    respuestas = []
    for a in asistencias:
        if mes is not None and a.fecha.month != mes:
            continue
        if year is not None and a.fecha.year != year:
            continue

        resp = AsistenciaResponse.model_validate(a)
        resp.empleado_nombre = str(a.empleado.nombre_completo) if a.empleado else "Desconocido"
        respuestas.append(resp)

    return respuestas


@router.post("/bulk", response_model=dict[str, str])
async def bulk_create_or_update_asistencias(
    request: BulkAsistenciaRequest,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    for item in request.registros:
        # Check if exists
        result = await session.execute(
            select(Asistencia).where(
                Asistencia.empleado_id == item.idempleado, Asistencia.fecha == item.fecha
            )
        )
        asistencia = result.scalar_one_or_none()

        if asistencia:
            asistencia.tipo = item.tipo  # type: ignore[assignment]
            session.add(asistencia)
        else:
            new_asistencia = Asistencia(
                empleado_id=item.idempleado, fecha=item.fecha, tipo=item.tipo
            )
            session.add(new_asistencia)

    await session.commit()
    return {"message": "Registros guardados exitosamente"}


@router.post("", response_model=AsistenciaResponse)
async def create_asistencia(
    asistencia_in: AsistenciaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(Empleado).where(Empleado.id == asistencia_in.empleado_id))
    empleado = result.scalar_one_or_none()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    new_asistencia = Asistencia(**asistencia_in.model_dump())
    session.add(new_asistencia)
    await session.commit()
    await session.refresh(new_asistencia)

    resp = AsistenciaResponse.model_validate(new_asistencia)
    resp.empleado_nombre = str(empleado.nombre_completo)
    return resp


@router.patch("/{asistencia_id}", response_model=AsistenciaResponse)
async def update_asistencia(
    asistencia_id: int,
    asistencia_in: AsistenciaUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(
        select(Asistencia)
        .options(selectinload(Asistencia.empleado))
        .where(Asistencia.id == asistencia_id)
    )
    asistencia = result.scalar_one_or_none()
    if not asistencia:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")

    update_data = asistencia_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asistencia, field, value)

    session.add(asistencia)
    await session.commit()
    await session.refresh(asistencia)

    resp = AsistenciaResponse.model_validate(asistencia)
    resp.empleado_nombre = (
        str(asistencia.empleado.nombre_completo) if asistencia.empleado else "Desconocido"
    )
    return resp


async def procesar_checada(session: AsyncSession, empleado_id: int, timestamp: datetime) -> None:
    # Lógica para consolidar en Asistencia
    fecha = timestamp.date()
    hora_str = timestamp.strftime("%H:%M")

    # Buscar asistencia de ese día
    result = await session.execute(
        select(Asistencia).where(Asistencia.empleado_id == empleado_id, Asistencia.fecha == fecha)
    )
    asistencia = result.scalar_one_or_none()

    if not asistencia:
        asistencia = Asistencia(
            empleado_id=empleado_id, fecha=fecha, hora_entrada=hora_str, tipo="Normal"
        )
        session.add(asistencia)
    else:
        # Si ya existe, actualizamos entrada o salida según convenga
        if not asistencia.hora_entrada:
            asistencia.hora_entrada = hora_str  # type: ignore
        else:
            asistencia.hora_salida = hora_str  # type: ignore
            # Aquí podríamos hacer reglas más complejas,
            # pero por ahora simplemente actualizamos la salida al último toque
        session.add(asistencia)
    await session.commit()


@router.post("/checar", response_model=RegistroChecadorResponse)
async def registrar_checada_web(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    """Endpoint para que el empleado activo registre su asistencia vía web"""
    ahora = datetime.now()
    nuevo_registro = RegistroChecador(
        empleado_id=current_user.id, timestamp_checada=ahora, metodo="Web", procesado=True
    )
    session.add(nuevo_registro)
    await session.commit()
    await session.refresh(nuevo_registro)

    await procesar_checada(session, current_user.id, ahora)  # type: ignore
    return nuevo_registro


@router.post("/webhook", response_model=RegistroChecadorResponse)
async def registrar_checada_webhook(
    registro_in: RegistroChecadorCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> Any:
    """
    Endpoint diseñado para ser consumido por Checadores Biométricos o Proxies locales.
    Nota: En producción, este endpoint requeriría un API Key estático en vez de token JWT.
    """
    nuevo_registro = RegistroChecador(
        empleado_id=registro_in.empleado_id,
        timestamp_checada=registro_in.timestamp_checada,
        metodo=registro_in.metodo,
        dispositivo_ip=registro_in.dispositivo_ip,
        procesado=True,
    )
    session.add(nuevo_registro)
    await session.commit()
    await session.refresh(nuevo_registro)

    await procesar_checada(session, registro_in.empleado_id, registro_in.timestamp_checada)
    return nuevo_registro


@router.get("/mis-asistencias", response_model=list[AsistenciaResponse])
async def get_mis_asistencias(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    """Obtiene las asistencias del empleado autenticado"""
    query = (
        select(Asistencia)
        .options(selectinload(Asistencia.empleado))
        .where(Asistencia.empleado_id == current_user.id)
        .order_by(Asistencia.fecha.desc())
    )
    result = await session.execute(query)
    asistencias = result.scalars().all()

    respuestas = []
    for a in asistencias:
        resp = AsistenciaResponse.model_validate(a)
        resp.empleado_nombre = str(a.empleado.nombre_completo) if a.empleado else "Desconocido"
        respuestas.append(resp)
    return respuestas
