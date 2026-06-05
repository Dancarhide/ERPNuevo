from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import AuditoriaMixin, Base


class Conversacion(Base, AuditoriaMixin):
    __tablename__ = "conversaciones"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=True)
    tipo = Column(String(50), default="privada", nullable=False)
    creado_por_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True)

    creador = relationship("Empleado", foreign_keys=[creado_por_id])
    mensajes = relationship("Mensaje", back_populates="conversacion", cascade="all, delete-orphan")
    participantes = relationship(
        "ConversacionParticipante", back_populates="conversacion", cascade="all, delete-orphan"
    )


class ConversacionParticipante(Base, AuditoriaMixin):
    __tablename__ = "conversacion_participantes"

    id = Column(Integer, primary_key=True, index=True)
    conversacion_id = Column(
        Integer, ForeignKey("conversaciones.id", ondelete="CASCADE"), nullable=False
    )
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False)

    conversacion = relationship("Conversacion", back_populates="participantes")
    empleado = relationship("Empleado")


class Mensaje(Base, AuditoriaMixin):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True, index=True)
    conversacion_id = Column(
        Integer, ForeignKey("conversaciones.id", ondelete="CASCADE"), nullable=False, index=True
    )
    emisor_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True)
    contenido = Column(String, nullable=False)
    leido = Column(Boolean, default=False, nullable=False)

    conversacion = relationship("Conversacion", back_populates="mensajes")
    emisor = relationship("Empleado")


class Tarea(Base, AuditoriaMixin):
    __tablename__ = "tareas"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False)
    asignado_por_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True
    )

    titulo = Column(String(255), nullable=False)
    descripcion = Column(String, nullable=True)
    prioridad = Column(String(20), default="Media", nullable=False)
    fecha_vencimiento = Column(Date, nullable=True)
    completada = Column(Boolean, default=False, nullable=False)

    empleado_asignado = relationship("Empleado", foreign_keys=[empleado_id])
    asignador = relationship("Empleado", foreign_keys=[asignado_por_id])


class Notificacion(Base, AuditoriaMixin):
    __tablename__ = "notificaciones"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=True, index=True
    )
    titulo = Column(String(100), nullable=False)
    mensaje = Column(String, nullable=False)
    tipo = Column(String(50), nullable=False)
    leida = Column(Boolean, default=False, nullable=False)
    link = Column(String(255), nullable=True)

    empleado = relationship("Empleado")


class EventoEmpresa(Base, AuditoriaMixin):
    __tablename__ = "eventos_empresa"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(String, nullable=True)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    hora_inicio = Column(String(5), nullable=True)
    hora_fin = Column(String(5), nullable=True)
    tipo = Column(String(50), default="Evento", nullable=False)
    color = Column(String(7), nullable=True)
    creado_por_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True)

    creador = relationship("Empleado", foreign_keys=[creado_por_id])
    participantes = relationship(
        "EventoParticipante", back_populates="evento", cascade="all, delete-orphan"
    )


class EventoParticipante(Base, AuditoriaMixin):
    __tablename__ = "evento_participantes"

    evento_id = Column(
        Integer, ForeignKey("eventos_empresa.id", ondelete="CASCADE"), primary_key=True
    )
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="CASCADE"), primary_key=True)

    evento = relationship("EventoEmpresa", back_populates="participantes")
    empleado = relationship("Empleado")
