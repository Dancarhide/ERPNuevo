from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class PuestoBase(BaseModel):
    nombre_puesto: str
    descripcion: Optional[str] = None
    hierarchy_level: Optional[int] = 10
    area_id: Optional[int] = None
    beneficios: Optional[str] = None
    requisitos: Optional[str] = None
    sueldo_min: Optional[Decimal] = None
    sueldo_max: Optional[Decimal] = None
    reporta_a_puesto_id: Optional[int] = None
    reporta_matricialmente_a_id: Optional[int] = None
    es_rol_staff: bool = False


class PuestoCreate(PuestoBase):
    pass


class PuestoUpdate(PuestoBase):
    nombre_puesto: str | None = None  # type: ignore[assignment]
    hierarchy_level: int | None = None


class PuestoResponse(PuestoBase):
    id: int
    personal_actual: int

    class Config:
        from_attributes = True
