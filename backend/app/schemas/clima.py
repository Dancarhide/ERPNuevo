from datetime import date
from typing import Dict, List, Optional

from pydantic import BaseModel


# --- Campaña ---
class CampaniaClimaBase(BaseModel):
    nombre: str
    fecha_inicio: date
    fecha_fin: date
    activa: bool = True


class CampaniaClimaCreate(CampaniaClimaBase):
    pass


class CampaniaClimaUpdate(BaseModel):
    nombre: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    activa: Optional[bool] = None


class CampaniaClimaResponse(CampaniaClimaBase):
    id: int

    class Config:
        from_attributes = True


# --- Preguntas ---
class PreguntaClimaBase(BaseModel):
    categoria: str
    pregunta: str


class PreguntaClimaCreate(PreguntaClimaBase):
    pass


class PreguntaClimaResponse(PreguntaClimaBase):
    id: int

    class Config:
        from_attributes = True


# --- Respuestas ---
class RespuestaClimaCreate(BaseModel):
    campania_id: int
    nivel_jerarquico: Optional[str] = None
    ubicacion: Optional[str] = None
    respuestas: Dict[str, int]  # key: pregunta_id (str), value: 1-4


class RespuestaClimaResponse(BaseModel):
    id: int
    campania_id: int
    empleado_id: int
    nivel_jerarquico: Optional[str]
    ubicacion: Optional[str]
    respuestas_json: Dict[str, int]

    class Config:
        from_attributes = True


# --- Estadísticas ---
class PromedioCategoria(BaseModel):
    categoria: str
    promedio: float


class RespuestaDetalle(BaseModel):
    empleado_nombre: str
    nivel_jerarquico: Optional[str]
    ubicacion: Optional[str]
    promedio_general: float
    fecha_respuesta: str


class EstadisticasClimaResponse(BaseModel):
    total_respuestas: int
    promedios_por_categoria: List[PromedioCategoria]
    respuestas_individuales: List[RespuestaDetalle]
