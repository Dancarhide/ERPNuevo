from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, event
from sqlalchemy.orm import DeclarativeBase

from app.core.context import current_user_id_var


class Base(DeclarativeBase):
    pass


class AuditoriaMixin:
    """Mixin para agregar fechas de auditoría y borrado lógico."""

    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    creado_por_id = Column(Integer, nullable=True)
    actualizado_por_id = Column(Integer, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)


@event.listens_for(AuditoriaMixin, "before_insert", propagate=True)
def receive_before_insert(mapper, connection, target):
    user_id = current_user_id_var.get()
    if user_id is not None:
        target.creado_por_id = user_id
        target.actualizado_por_id = user_id


@event.listens_for(AuditoriaMixin, "before_update", propagate=True)
def receive_before_update(mapper, connection, target):
    user_id = current_user_id_var.get()
    if user_id is not None:
        target.actualizado_por_id = user_id
