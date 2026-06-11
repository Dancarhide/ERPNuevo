from typing import List, Optional

from pydantic import BaseModel


class EvaluacionBase(BaseModel):
    pregunta: str
    tipo_evaluacion: str


class EvaluacionCreate(EvaluacionBase):
    pass


class EvaluacionResponse(EvaluacionBase):
    id: int

    class Config:
        from_attributes = True


class RespuestaItem(BaseModel):
    id_pregunta: int
    respuesta: str


class RespuestasCreate(BaseModel):
    id_empleado: int
    respuestas: List[RespuestaItem]


class RespuestaDetalle(BaseModel):
    pregunta: str
    tipo: str
    respuesta: str
    valor_numerico: Optional[float] = None


class ResultadoEmpleadoResponse(BaseModel):
    promedio: float
    respuestas: List[RespuestaDetalle]
