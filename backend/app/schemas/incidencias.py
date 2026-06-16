from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class EmpleadoBasico(BaseModel):
    id: int
    nombre_completo: str

    class Config:
        from_attributes = True


class IncidenciaBase(BaseModel):
    titulo: str
    descripcion: str
    tipo: str
    gravedad: Optional[str] = None
    estatus: Optional[str] = "Pendiente"
    fecha_incidencia: date
    evidencia_url: Optional[str] = None


class IncidenciaCreate(IncidenciaBase):
    empleado_reportado_id: int


class IncidenciaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    gravedad: Optional[str] = None
    estatus: Optional[str] = None
    fecha_incidencia: Optional[date] = None
    evidencia_url: Optional[str] = None


class IncidenciaResponse(IncidenciaBase):
    id: int
    empleado_reportado_id: int
    reportante_id: Optional[int] = None
    creado_en: datetime
    actualizado_en: Optional[datetime] = None

    empleado_reportado: Optional[EmpleadoBasico] = None
    reportante: Optional[EmpleadoBasico] = None

    class Config:
        from_attributes = True
