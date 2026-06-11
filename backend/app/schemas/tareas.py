from datetime import date
from typing import Optional

from pydantic import BaseModel


class TareaBase(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    prioridad: str = "Media"
    fecha_vencimiento: Optional[date] = None


class TareaCreate(TareaBase):
    pass


class TareaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    prioridad: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    completada: Optional[bool] = None


class TareaResponse(TareaBase):
    id: int
    empleado_id: int
    asignado_por_id: Optional[int] = None
    completada: bool

    class Config:
        from_attributes = True
