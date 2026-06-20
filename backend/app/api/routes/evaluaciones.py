import logging
from typing import Annotated, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.talento import CampaniaEvaluacion, Evaluacion, RespuestaEvaluacion
from app.schemas.empleados import EmpleadoResponse
from app.schemas.evaluaciones import (
    CampaniaEvaluacionCreate,
    CampaniaEvaluacionResponse,
    EvaluacionCreate,
    EvaluacionResponse,
    RespuestaDetalle,
    RespuestasCreate,
    ResultadoEmpleadoResponse,
)
from app.services.notificaciones_service import crear_notificacion_masiva

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/campanias", response_model=List[CampaniaEvaluacionResponse])
async def read_campanias(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    stmt = select(CampaniaEvaluacion).order_by(CampaniaEvaluacion.id.desc())
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post(
    "/campanias", response_model=CampaniaEvaluacionResponse, status_code=status.HTTP_201_CREATED
)
async def create_campania(
    camp_in: CampaniaEvaluacionCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    new_camp = CampaniaEvaluacion(**camp_in.model_dump())
    session.add(new_camp)
    await session.commit()
    await session.refresh(new_camp)

    await crear_notificacion_masiva(
        session=session,
        titulo="Nueva Evaluación Disponible",
        mensaje=f"Se ha abierto un nuevo ciclo de evaluación: {new_camp.nombre}",
        tipo="evaluaciones",
        link="/dashboard/evaluaciones",
    )

    return new_camp


@router.put("/campanias/{camp_id}/cerrar", response_model=CampaniaEvaluacionResponse)
async def close_campania(
    camp_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(
        select(CampaniaEvaluacion).where(CampaniaEvaluacion.id == camp_id)
    )
    camp = result.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    camp.activa = False
    await session.commit()
    await session.refresh(camp)
    return camp


@router.get("/objetivos", response_model=List[EmpleadoResponse])
async def get_objetivos_evaluacion(
    tipo: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
    campania_id: Optional[int] = None,
) -> Any:
    if tipo == "jefe_subordinado":
        stmt = select(Empleado).where(Empleado.jefe_directo_id == current_user.id)
    elif tipo == "360_grados":
        if current_user.jefe_directo_id:
            stmt = select(Empleado).where(
                (Empleado.jefe_directo_id == current_user.jefe_directo_id)
                & (Empleado.id != current_user.id)
            )
        else:
            # If no manager, find direct reports or empty
            stmt = select(Empleado).where(Empleado.jefe_directo_id == current_user.id)
    elif tipo == "auto_evaluacion" or tipo == "satisfaccion":
        stmt = select(Empleado).where(Empleado.id == current_user.id)
    else:
        return []

    if campania_id:
        subq = (
            select(RespuestaEvaluacion.empleado_id)
            .join(Evaluacion, Evaluacion.id == RespuestaEvaluacion.pregunta_id)
            .where(
                RespuestaEvaluacion.evaluador_id == current_user.id,
                RespuestaEvaluacion.campania_id == campania_id,
                Evaluacion.tipo_evaluacion == tipo,
            )
        )
        stmt = stmt.where(Empleado.id.not_in(subq))

    stmt = stmt.options(
        selectinload(Empleado.familiares),
        selectinload(Empleado.datos_salud),
        selectinload(Empleado.area),
        selectinload(Empleado.puesto),
        selectinload(Empleado.jefe_directo),
    )

    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("", response_model=List[EvaluacionResponse])
async def read_evaluaciones(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
    tipo: Optional[str] = None,
) -> Any:
    stmt = select(Evaluacion)
    if tipo:
        stmt = stmt.where(Evaluacion.tipo_evaluacion == tipo)
    result = await session.execute(stmt)
    evaluaciones = result.scalars().all()
    # Map fields for response
    # En el modelo original, el id es 'id', pero el frontend a veces espera 'idquestion'.
    # Usaremos id y en el frontend ajustaremos la interfaz.
    return evaluaciones


@router.post("", response_model=EvaluacionResponse, status_code=status.HTTP_201_CREATED)
async def create_evaluacion(
    eval_in: EvaluacionCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Solo admin debería crear (asumimos validación en el frontend o middleware)
    new_eval = Evaluacion(
        pregunta=eval_in.pregunta,
        tipo_evaluacion=eval_in.tipo_evaluacion,
    )
    session.add(new_eval)
    await session.commit()
    await session.refresh(new_eval)
    return new_eval


@router.delete("/{eval_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evaluacion(
    eval_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> None:
    result = await session.execute(select(Evaluacion).where(Evaluacion.id == eval_id))
    evaluacion = result.scalar_one_or_none()
    if not evaluacion:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")

    await session.delete(evaluacion)
    await session.commit()


@router.post("/respuestas", status_code=status.HTTP_201_CREATED)
async def submit_respuestas(
    data_in: RespuestasCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    for item in data_in.respuestas:
        nueva_resp = RespuestaEvaluacion(
            pregunta_id=item.id_pregunta,
            empleado_id=data_in.id_empleado,
            campania_id=data_in.campania_id,
            evaluador_id=data_in.evaluador_id,
            respuesta=item.respuesta,
        )
        session.add(nueva_resp)

    await session.commit()
    return {"message": "Respuestas guardadas exitosamente"}


@router.get("/resultados/{empleado_id}", response_model=ResultadoEmpleadoResponse)
async def read_resultados(
    empleado_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    stmt = (
        select(RespuestaEvaluacion, Evaluacion)
        .join(Evaluacion, Evaluacion.id == RespuestaEvaluacion.pregunta_id)
        .where(RespuestaEvaluacion.empleado_id == empleado_id)
    )
    result = await session.execute(stmt)
    filas = result.all()

    detalles = []
    sum_numerico = 0.0
    count_numerico = 0

    for resp, evaluacion in filas:
        val_num = None
        try:
            val_num = float(resp.respuesta)
            sum_numerico += val_num
            count_numerico += 1
        except (ValueError, TypeError) as e:
            logger.error("Error al convertir respuesta a número en read_resultados: %s", e)

        detalles.append(
            RespuestaDetalle(
                pregunta=evaluacion.pregunta,
                tipo=evaluacion.tipo_evaluacion,
                respuesta=resp.respuesta,
                valor_numerico=val_num,
            )
        )

    promedio = 0.0
    if count_numerico > 0:
        promedio = round(sum_numerico / count_numerico, 1)

    return ResultadoEmpleadoResponse(
        promedio=promedio,
        respuestas=detalles,
    )


@router.get("/resultados-globales", response_model=ResultadoEmpleadoResponse)
async def read_resultados_globales(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
    campania_id: Optional[int] = None,
) -> Any:
    stmt = select(RespuestaEvaluacion, Evaluacion).join(
        Evaluacion, Evaluacion.id == RespuestaEvaluacion.pregunta_id
    )
    if campania_id:
        stmt = stmt.where(RespuestaEvaluacion.campania_id == campania_id)

    result = await session.execute(stmt)
    filas = result.all()

    detalles = []
    sum_numerico = 0.0
    count_numerico = 0

    for resp, evaluacion in filas:
        val_num = None
        try:
            val_num = float(resp.respuesta)
            sum_numerico += val_num
            count_numerico += 1
        except (ValueError, TypeError) as e:
            logger.error("Error al convertir respuesta a número en read_resultados_globales: %s", e)

        detalles.append(
            RespuestaDetalle(
                pregunta=evaluacion.pregunta,
                tipo=evaluacion.tipo_evaluacion,
                respuesta=resp.respuesta,
                valor_numerico=val_num,
            )
        )

    promedio = 0.0
    if count_numerico > 0:
        promedio = round(sum_numerico / count_numerico, 1)

    return ResultadoEmpleadoResponse(
        promedio=promedio,
        respuestas=detalles,
    )
