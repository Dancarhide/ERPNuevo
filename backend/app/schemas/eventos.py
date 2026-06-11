from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class EventoBase(BaseModel):
    titulo: str = Field(..., max_length=200)
    descripcion: Optional[str] = None
    fecha_inicio: date
    fecha_fin: date
    hora_inicio: Optional[str] = Field(None, max_length=5)
    hora_fin: Optional[str] = Field(None, max_length=5)
    tipo: str = Field("Evento", max_length=50)
    color: Optional[str] = Field(None, max_length=7)


class EventoCreate(EventoBase):
    pass


class EventoUpdate(EventoBase):
    titulo: Optional[str] = Field(None, max_length=200)
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None


class EventoResponse(EventoBase):
    id: int
    creado_por_id: Optional[int]

    class Config:
        from_attributes = True
