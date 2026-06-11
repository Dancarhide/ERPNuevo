from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel


class RegistroChecadorBase(BaseModel):
    timestamp_checada: datetime
    metodo: str = "Web"
    dispositivo_ip: Optional[str] = None


class RegistroChecadorCreate(RegistroChecadorBase):
    empleado_id: int


class RegistroChecadorResponse(RegistroChecadorBase):
    id: int
    empleado_id: int
    procesado: bool

    class Config:
        from_attributes = True


class AsistenciaBase(BaseModel):
    fecha: date
    tipo: str
    hora_entrada: Optional[time] = None
    hora_salida: Optional[time] = None
    justificacion: Optional[str] = None


class AsistenciaCreate(AsistenciaBase):
    empleado_id: int


class AsistenciaUpdate(BaseModel):
    tipo: Optional[str] = None
    hora_entrada: Optional[time] = None
    hora_salida: Optional[time] = None
    justificacion: Optional[str] = None


class AsistenciaResponse(AsistenciaBase):
    id: int
    empleado_id: int
    empleado_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class BulkAsistenciaItem(BaseModel):
    idempleado: int
    fecha: date
    tipo: str


class BulkAsistenciaRequest(BaseModel):
    registros: list[BulkAsistenciaItem]


class AsistenciasListResponse(BaseModel):
    items: list[AsistenciaResponse]
    total: int
    page: int
    size: int
