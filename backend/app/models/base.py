from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class AuditoriaMixin:
    """Mixin para agregar fechas de auditoría y borrado lógico."""

    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    activo = Column(Boolean, default=True, nullable=False)
