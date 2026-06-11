from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificacionBase(BaseModel):
    titulo: str
    mensaje: str
    tipo: str
    link: Optional[str] = None


class NotificacionCreate(NotificacionBase):
    empleado_id: int


class NotificacionResponse(NotificacionBase):
    id: int
    empleado_id: Optional[int] = None
    leida: bool
    creado_en: datetime

    class Config:
        from_attributes = True
