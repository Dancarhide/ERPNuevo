from datetime import date, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Date, cast, func
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
    AsistenciasListResponse,
    AsistenciaUpdate,
    BulkAsistenciaRequest,
    RegistroChecadorCreate,
    RegistroChecadorResponse,
)

router = APIRouter()


@router.get("", response_model=AsistenciasListResponse)
async def get_asistencias(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_asistencia"))],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None, description="Búsqueda por nombre de empleado"),
    tipo: str = Query(None, description="Filtro por tipo de asistencia"),
    area_id: int | None = Query(None, description="Filtro por área"),
    fecha_inicio: date | None = Query(None, description="Fecha desde"),
    fecha_fin: date | None = Query(None, description="Fecha hasta"),
) -> Any:
    base_query = (
        select(Asistencia)
        .outerjoin(Empleado, Asistencia.empleado_id == Empleado.id)
        .where(Empleado.es_sistema.is_(False))
    )

    if search:
        base_query = base_query.where(Empleado.nombre_completo.ilike(f"%{search}%"))

    if tipo and tipo != "Todos":
        base_query = base_query.where(Asistencia.tipo == tipo)

    if area_id:
        base_query = base_query.where(Empleado.area_id == area_id)

    if fecha_inicio:
        base_query = base_query.where(Asistencia.fecha >= fecha_inicio)

    if fecha_fin:
        base_query = base_query.where(Asistencia.fecha <= fecha_fin)

    base_query = base_query.order_by(Asistencia.fecha.desc())

    # Count total
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    # Paginate
    query = base_query.options(selectinload(Asistencia.empleado))
    query = query.offset((page - 1) * size).limit(size)
    result = await session.execute(query)
    asistencias = result.scalars().all()

    respuestas = []
    for a in asistencias:
        resp = AsistenciaResponse.model_validate(a)
        resp.empleado_nombre = str(a.empleado.nombre_completo) if a.empleado else "Desconocido"
        respuestas.append(resp)

    return {"items": respuestas, "total": total, "page": page, "size": size}


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
    # Lógica para consolidar en Asistencia (4 checadas y tiempo efectivo)
    fecha = timestamp.date()

    # 1. Obtener todas las checadas del día
    res_checadas = await session.execute(
        select(RegistroChecador)
        .where(RegistroChecador.empleado_id == empleado_id)
        .where(cast(RegistroChecador.timestamp_checada, Date) == fecha)
        .order_by(RegistroChecador.timestamp_checada.asc())
    )
    checadas = res_checadas.scalars().all()

    # 2. Obtener el registro de Asistencia de ese día
    result = await session.execute(
        select(Asistencia).where(Asistencia.empleado_id == empleado_id, Asistencia.fecha == fecha)
    )
    asistencia = result.scalar_one_or_none()

    if not asistencia:
        asistencia = Asistencia(empleado_id=empleado_id, fecha=fecha, tipo="Normal")
        session.add(asistencia)

    # 3. Asignar las 4 checadas según la cantidad
    cantidad = len(checadas)
    asistencia.hora_entrada = None
    asistencia.hora_salida = None
    asistencia.hora_salida_descanso = None
    asistencia.hora_entrada_descanso = None

    if cantidad > 0:
        asistencia.hora_entrada = checadas[0].timestamp_checada.strftime("%H:%M")

    if cantidad == 2:
        # Decidir si la segunda checada es salida o descanso (umbral de 6 horas)
        delta = checadas[1].timestamp_checada - checadas[0].timestamp_checada
        if delta.total_seconds() >= 6 * 3600:
            asistencia.hora_salida = checadas[1].timestamp_checada.strftime("%H:%M")
        else:
            asistencia.hora_salida_descanso = checadas[1].timestamp_checada.strftime("%H:%M")

    elif cantidad == 3:
        asistencia.hora_salida_descanso = checadas[1].timestamp_checada.strftime("%H:%M")
        asistencia.hora_entrada_descanso = checadas[2].timestamp_checada.strftime("%H:%M")

    elif cantidad >= 4:
        asistencia.hora_salida_descanso = checadas[1].timestamp_checada.strftime("%H:%M")
        asistencia.hora_entrada_descanso = checadas[2].timestamp_checada.strftime("%H:%M")
        asistencia.hora_salida = checadas[-1].timestamp_checada.strftime("%H:%M")  # El último toque

    # 4. Calcular tiempo efectivo
    minutos = 0
    if cantidad >= 2:
        delta1 = checadas[1].timestamp_checada - checadas[0].timestamp_checada
        minutos += int(delta1.total_seconds() / 60)
    if cantidad >= 4:
        delta2 = checadas[-1].timestamp_checada - checadas[2].timestamp_checada
        minutos += int(delta2.total_seconds() / 60)

    asistencia.tiempo_efectivo_minutos = max(0, minutos)

    # 5. Lógica de Incidencias (Retardo)
    from app.models.asistencia import Incidencia
    from app.models.empleados import Empleado

    emp = await session.get(Empleado, empleado_id)
    if emp and emp.turno_entrada and asistencia.hora_entrada:
        # Convertir a minutos desde medianoche
        h_ent, m_ent = map(int, asistencia.hora_entrada.split(":"))
        h_tur, m_tur = map(int, emp.turno_entrada.split(":"))

        mins_ent = h_ent * 60 + m_ent
        mins_tur = h_tur * 60 + m_tur

        tolerancia = 15  # 15 minutos de tolerancia
        if mins_ent > (mins_tur + tolerancia):
            # Verificar si ya tiene incidencia de retardo para ese día
            res_inc = await session.execute(
                select(Incidencia).where(
                    Incidencia.empleado_reportado_id == empleado_id,
                    Incidencia.fecha_incidencia == fecha,
                    Incidencia.tipo == "Retardo",
                )
            )
            inc_existente = res_inc.scalar_one_or_none()
            if not inc_existente:
                nueva_incidencia = Incidencia(
                    empleado_reportado_id=empleado_id,
                    titulo="Retardo Automático",
                    tipo="Retardo",
                    fecha_incidencia=fecha,
                    estatus="Aprobada",
                    descripcion=(
                        f"Retardo automático. Llegó a las {asistencia.hora_entrada} "
                        f"(Turno: {emp.turno_entrada})"
                    ),
                )
                session.add(nueva_incidencia)

    # 6. Lógica de Incidencias (Horas Extra Automáticas - Aprobación Pendiente)
    if asistencia.tiempo_efectivo_minutos > 540:
        res_he = await session.execute(
            select(Incidencia).where(
                Incidencia.empleado_reportado_id == empleado_id,
                Incidencia.fecha_incidencia == fecha,
                Incidencia.tipo == "Horas Extra",
            )
        )
        he_existente = res_he.scalar_one_or_none()
        if not he_existente:
            minutos_extra = asistencia.tiempo_efectivo_minutos - 480
            horas_extra = round(minutos_extra / 60.0, 1)
            nueva_he = Incidencia(
                empleado_reportado_id=empleado_id,
                titulo=f"Aprobación Pendiente: {horas_extra} Horas Extra",
                tipo="Horas Extra",
                fecha_incidencia=fecha,
                estatus="Pendiente",
                descripcion=(
                    f"El empleado acumuló {asistencia.tiempo_efectivo_minutos} minutos de tiempo "
                    "efectivo. Favor de revisar y aprobar."
                ),
            )
            session.add(nueva_he)
            await session.flush()

            # Notificar al jefe directo
            from app.services.notificaciones_service import crear_notificacion

            if emp and emp.jefe_directo_id:
                try:
                    await crear_notificacion(
                        session=session,
                        empleado_id=emp.jefe_directo_id,
                        titulo="Horas Extra Pendientes",
                        mensaje=(
                            f"El empleado {emp.nombre_completo} tiene {horas_extra} "
                            f"horas extra pendientes de aprobación del día {fecha}."
                        ),
                        tipo="warning",
                        link="/incidencias",
                    )
                except Exception:
                    pass

    await session.commit()


@router.post("/checar", response_model=RegistroChecadorResponse)
async def registrar_checada_web(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    """Endpoint para que el empleado activo registre su asistencia vía web"""
    ahora = datetime.now()

    from app.core.config import settings

    if getattr(settings, "ENVIRONMENT", "dev") == "dev":
        from datetime import timedelta

        # Simulador de checadas para pruebas
        res_ultimo = await session.execute(
            select(RegistroChecador)
            .where(RegistroChecador.empleado_id == current_user.id)
            .order_by(RegistroChecador.timestamp_checada.desc())
            .limit(1)
        )
        ultimo = res_ultimo.scalar_one_or_none()

        if ultimo:
            fecha_ultimo = ultimo.timestamp_checada.date()
            res_count = await session.execute(
                select(func.count())
                .select_from(RegistroChecador)
                .where(RegistroChecador.empleado_id == current_user.id)
                .where(cast(RegistroChecador.timestamp_checada, Date) == fecha_ultimo)
            )
            count = res_count.scalar_one()

            if count >= 4:
                # Mover al siguiente día si ya completó el ciclo (4 checadas)
                ahora = datetime.combine(fecha_ultimo + timedelta(days=1), datetime.now().time())
            else:
                # Mantener el día simulado actual, pero usar la hora real
                # (Quitamos el salto de 2 horas para que sea en tiempo real)
                ahora = datetime.combine(fecha_ultimo, datetime.now().time())

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
