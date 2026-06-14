from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import AuditoriaMixin, Base


class RegistroChecador(Base, AuditoriaMixin):
    """
    Guarda los 'punches' o checadas crudas (raw) provenientes del checador biométrico o de la web.
    """

    __tablename__ = "registros_checador"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False, index=True
    )
    timestamp_checada = Column(DateTime, nullable=False, index=True)
    metodo = Column(String(50), default="Web")  # Huella, Rostro, Tarjeta, Web, Importacion
    dispositivo_ip = Column(String(50), nullable=True)  # IP o ID del reloj checador
    procesado = Column(
        Boolean, default=False
    )  # Para saber si ya se usó para calcular hora_entrada/salida

    empleado = relationship("Empleado", foreign_keys=[empleado_id])


class Asistencia(Base, AuditoriaMixin):
    __tablename__ = "asistencias"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fecha = Column(Date, nullable=False, index=True)
    hora_entrada = Column(String(5), nullable=True)
    hora_salida_descanso = Column(String(5), nullable=True)
    hora_entrada_descanso = Column(String(5), nullable=True)
    hora_salida = Column(String(5), nullable=True)
    tiempo_efectivo_minutos = Column(Integer, default=0, nullable=False)
    tipo = Column(String(20), default="Normal", nullable=False)
    justificacion = Column(String, nullable=True)
    registrado_por_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True
    )

    empleado = relationship("Empleado", foreign_keys=[empleado_id], backref="asistencias")
    registrado_por = relationship("Empleado", foreign_keys=[registrado_por_id])


class Vacacion(Base, AuditoriaMixin):
    __tablename__ = "vacaciones"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    estatus_vacacion = Column(String(20), default="Pendiente", nullable=False)
    tipo_solicitud = Column(String(50), default="Vacaciones", nullable=False)
    motivo = Column(String, nullable=True)
    motivo_rechazo = Column(String, nullable=True)

    empleado = relationship("Empleado", foreign_keys=[empleado_id], backref="vacaciones")


class DiaFestivo(Base, AuditoriaMixin):
    __tablename__ = "dias_festivos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    nombre = Column(String(255), nullable=False)
    tipo_ley = Column(String(100), default="Obligatorio", nullable=False)
    paga_doble = Column(Boolean, default=True, nullable=False)
    nota_ley = Column(String, nullable=True)


class Incidencia(Base, AuditoriaMixin):
    __tablename__ = "incidencias"

    id = Column(Integer, primary_key=True, index=True)
    empleado_reportado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False
    )
    reportante_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True)
    titulo = Column(String(150), nullable=True)
    descripcion = Column(String, nullable=True)
    tipo = Column(String(50), nullable=True)
    gravedad = Column(String(20), nullable=True)
    estatus = Column(String(20), default="Pendiente", nullable=False)
    fecha_incidencia = Column(Date, nullable=True)
    evidencia_url = Column(String, nullable=True)

    empleado_reportado = relationship(
        "Empleado", foreign_keys=[empleado_reportado_id], backref="incidencias_recibidas"
    )
    reportante = relationship(
        "Empleado", foreign_keys=[reportante_id], backref="incidencias_reportadas"
    )
