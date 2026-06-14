from datetime import date
from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.talento import CampaniaClima, PreguntaClima, RespuestaClima
from app.schemas.clima import (
    CampaniaClimaCreate,
    CampaniaClimaResponse,
    CampaniaClimaUpdate,
    EstadisticasClimaResponse,
    PreguntaClimaCreate,
    PreguntaClimaResponse,
    PromedioCategoria,
    RespuestaClimaCreate,
    RespuestaDetalle,
)

router = APIRouter()


# --- CAMPAÑAS ---
@router.get("/campanias", response_model=List[CampaniaClimaResponse])
async def read_campanias(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Retornar ordenadas por fecha de inicio descendente
    result = await session.execute(
        select(CampaniaClima).order_by(CampaniaClima.fecha_inicio.desc())
    )
    campanias = result.scalars().all()

    # Auto-cerrar campañas cuya fecha_fin ya pasó
    hoy = date.today()
    updated = False
    for c in campanias:
        if c.activa and c.fecha_fin < hoy:
            c.activa = False
            session.add(c)
            updated = True

    if updated:
        await session.commit()

    return campanias


@router.post("/campanias", response_model=CampaniaClimaResponse)
async def create_campania(
    campania_in: CampaniaClimaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    campania = CampaniaClima(**campania_in.model_dump())
    session.add(campania)
    await session.commit()
    await session.refresh(campania)
    return campania


@router.put("/campanias/{campania_id}", response_model=CampaniaClimaResponse)
async def update_campania(
    campania_id: int,
    campania_in: CampaniaClimaUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(CampaniaClima).where(CampaniaClima.id == campania_id))
    campania = result.scalar_one_or_none()
    if not campania:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")

    update_data = campania_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(campania, key, value)

    await session.commit()
    await session.refresh(campania)
    return campania


# --- PREGUNTAS ---
@router.get("/preguntas", response_model=List[PreguntaClimaResponse])
async def read_preguntas(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(PreguntaClima))
    return result.scalars().all()


@router.post("/preguntas", response_model=PreguntaClimaResponse)
async def create_pregunta(
    pregunta_in: PreguntaClimaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    pregunta = PreguntaClima(**pregunta_in.model_dump())
    session.add(pregunta)
    await session.commit()
    await session.refresh(pregunta)
    return pregunta


@router.delete("/preguntas/{pregunta_id}")
async def delete_pregunta(
    pregunta_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(PreguntaClima).where(PreguntaClima.id == pregunta_id))
    pregunta = result.scalar_one_or_none()
    if not pregunta:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")

    await session.delete(pregunta)
    await session.commit()
    return {"ok": True}


# --- RESPUESTAS / ENCUESTA ---
@router.get("/estado")
async def get_estado_encuesta(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    """Verifica si hay campaña activa y si el empleado ya la contestó."""
    today = date.today()
    result = await session.execute(
        select(CampaniaClima)
        .where(CampaniaClima.activa)
        .where(CampaniaClima.fecha_inicio <= today)
        .where(CampaniaClima.fecha_fin >= today)
        .order_by(CampaniaClima.id.desc())
    )
    campania_activa = result.scalars().first()

    if not campania_activa:
        return {"activa": False, "completada": False, "campania_id": None}

    # Revisar si ya contestó
    res_clima = await session.execute(
        select(RespuestaClima)
        .where(RespuestaClima.campania_id == campania_activa.id)
        .where(RespuestaClima.empleado_id == current_user.id)
    )
    ya_contesto = res_clima.scalar_one_or_none() is not None

    return {
        "activa": True,
        "completada": ya_contesto,
        "campania_id": campania_activa.id,
        "nombre_campania": campania_activa.nombre,
    }


@router.post("/responder")
async def responder_encuesta(
    respuesta_in: RespuestaClimaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Validar que la campaña exista
    res_camp = await session.execute(
        select(CampaniaClima).where(CampaniaClima.id == respuesta_in.campania_id)
    )
    if not res_camp.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Campaña no encontrada")

    # Validar que no haya respondido ya
    res_clima = await session.execute(
        select(RespuestaClima)
        .where(RespuestaClima.campania_id == respuesta_in.campania_id)
        .where(RespuestaClima.empleado_id == current_user.id)
    )
    if res_clima.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya has respondido esta encuesta")

    nueva_respuesta = RespuestaClima(
        campania_id=respuesta_in.campania_id,
        empleado_id=current_user.id,
        nivel_jerarquico=respuesta_in.nivel_jerarquico,
        ubicacion=respuesta_in.ubicacion,
        respuestas_json=respuesta_in.respuestas,
    )
    session.add(nueva_respuesta)
    await session.commit()
    return {"ok": True}


# --- ESTADÍSTICAS ---
@router.get("/stats/{campania_id}", response_model=EstadisticasClimaResponse)
async def get_estadisticas(
    campania_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Obtener las respuestas de la campaña
    result = await session.execute(
        select(RespuestaClima)
        .options(selectinload(RespuestaClima.empleado))
        .where(RespuestaClima.campania_id == campania_id)
    )
    respuestas = result.scalars().all()

    if not respuestas:
        return EstadisticasClimaResponse(
            total_respuestas=0, promedios_por_categoria=[], respuestas_individuales=[]
        )

    # Para calcular promedios, necesitamos saber qué pregunta corresponde a qué categoría.
    # Obtenemos todas las preguntas para hacer el mapeo.
    res_preguntas = await session.execute(select(PreguntaClima))
    preguntas_list = res_preguntas.scalars().all()

    # Dict map: pregunta_id (str) -> categoria (str)
    cat_map = {str(p.id): str(p.categoria) for p in preguntas_list}

    # Totales para promedios globales
    suma_categorias: dict[str, int] = {}
    count_categorias: dict[str, int] = {}

    # Lista de detalles
    detalles: List[RespuestaDetalle] = []

    for r in respuestas:
        sum_r = 0
        count_r = 0
        for p_id_str, val in r.respuestas_json.items():
            cat = cat_map.get(p_id_str, "Otros")

            # Global
            suma_categorias[cat] = suma_categorias.get(cat, 0) + val
            count_categorias[cat] = count_categorias.get(cat, 0) + 1

            # Individual
            sum_r += val
            count_r += 1

        promedio_individual = sum_r / count_r if count_r > 0 else 0

        # We need a date, usually created_at if AuditoriaMixin is used.
        # AuditoriaMixin provides `fecha_creacion`
        fecha_str = getattr(r, "fecha_creacion", date.today()).strftime("%Y-%m-%d")

        detalles.append(
            RespuestaDetalle(
                empleado_nombre=r.empleado.nombre_completo if r.empleado else "Desconocido",
                nivel_jerarquico=r.nivel_jerarquico,
                ubicacion=r.ubicacion,
                promedio_general=promedio_individual,
                fecha_respuesta=fecha_str,
            )
        )

    # Construir promedios globales
    promedios = []
    for cat in suma_categorias.keys():
        promedio = suma_categorias[cat] / count_categorias[cat]
        promedios.append(PromedioCategoria(categoria=cat, promedio=promedio))

    return EstadisticasClimaResponse(
        total_respuestas=len(respuestas),
        promedios_por_categoria=promedios,
        respuestas_individuales=detalles,
    )
