from sqlalchemy import JSON, Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.models.base import AuditoriaMixin, Base


class ConfiguracionDashboard(Base, AuditoriaMixin):
    __tablename__ = "configuracion_dashboard"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    layout_json = Column(JSON, nullable=False, default=[])

    empleado = relationship("Empleado")
