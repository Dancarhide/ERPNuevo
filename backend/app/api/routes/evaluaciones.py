from typing import Annotated, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.talento import Evaluacion, RespuestaEvaluacion
from app.schemas.evaluaciones import (
    EvaluacionCreate,
    EvaluacionResponse,
    RespuestaDetalle,
    RespuestasCreate,
    ResultadoEmpleadoResponse,
)

router = APIRouter()


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
        except (ValueError, TypeError):
            pass

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
