from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class MensajeBase(BaseModel):
    contenido: str


class MensajeCreate(MensajeBase):
    destinatario_id: int


class EmpleadoChatInfo(BaseModel):
    id: int
    nombre_completo: str

    class Config:
        from_attributes = True


class MensajeResponse(MensajeBase):
    id: int
    conversacion_id: int
    emisor_id: Optional[int] = None
    leido: bool
    creado_en: datetime

    # Datos opcionales para contexto
    emisor: Optional[EmpleadoChatInfo] = None

    class Config:
        from_attributes = True


class ConversacionResponse(BaseModel):
    id: int
    nombre: Optional[str] = None
    tipo: str
    participantes: List[EmpleadoChatInfo] = []
    ultimo_mensaje: Optional[MensajeResponse] = None

    class Config:
        from_attributes = True
