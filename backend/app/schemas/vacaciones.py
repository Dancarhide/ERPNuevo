from datetime import date
from typing import Optional

from pydantic import BaseModel


class VacacionBase(BaseModel):
    fecha_inicio: date
    fecha_fin: date
    tipo_solicitud: str = "Vacaciones"
    motivo: Optional[str] = None


class VacacionCreate(VacacionBase):
    empleado_id: int


class VacacionUpdate(BaseModel):
    estatus_vacacion: str
    motivo_rechazo: Optional[str] = None


class VacacionResponse(VacacionBase):
    id: int
    empleado_id: int
    estatus_vacacion: str
    motivo_rechazo: Optional[str] = None
    empleado_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class VacacionStatsResponse(BaseModel):
    total: int
    taken: int
    pending: int
    available: int
