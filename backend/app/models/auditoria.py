from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Integer, String

from app.models.base import Base


class AuditoriaLog(Base):
    __tablename__ = "auditoria_logs"

    id = Column(Integer, primary_key=True, index=True)
    tabla_afectada = Column(String(100), nullable=False)
    registro_id = Column(String(100), nullable=False)
    accion = Column(String(20), nullable=False)  # INSERT, UPDATE, DELETE
    cambios = Column(JSON, nullable=True)  # { "campo": {"old": X, "new": Y} }

    # Track user and time
    realizado_por_id = Column(Integer, nullable=True)  # Puede ser null si lo hace el sistema
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
