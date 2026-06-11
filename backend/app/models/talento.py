from sqlalchemy import JSON, Boolean, Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import AuditoriaMixin, Base


class Vacante(Base, AuditoriaMixin):
    __tablename__ = "vacantes"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(100), nullable=False)
    descripcion = Column(String, nullable=True)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    puesto_id = Column(Integer, ForeignKey("puestos.id", ondelete="SET NULL"), nullable=True)

    cantidad_solicitada = Column(Integer, nullable=False)
    cantidad_contratada = Column(Integer, default=0, nullable=False)
    estatus = Column(String(20), default="Abierta", nullable=False)

    candidatos = relationship("Candidato", back_populates="vacante")
    area = relationship("Area")
    rol = relationship("Rol")
    puesto = relationship("Puesto")


class Candidato(Base, AuditoriaMixin):
    __tablename__ = "candidatos"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(255), nullable=False)
    email = Column(String(100), nullable=True)
    telefono = Column(String(20), nullable=True)
    cv_url = Column(String, nullable=True)

    vacante_id = Column(Integer, ForeignKey("vacantes.id", ondelete="SET NULL"), nullable=True)
    puesto_id = Column(Integer, ForeignKey("puestos.id", ondelete="SET NULL"), nullable=True)

    estatus = Column(String(20), default="Postulado", nullable=False)
    notas = Column(String, nullable=True)

    vacante = relationship("Vacante", back_populates="candidatos")
    puesto = relationship("Puesto")
    progresos = relationship(
        "CyiProgreso", back_populates="candidato", cascade="all, delete-orphan"
    )


class CyiProgreso(Base, AuditoriaMixin):
    __tablename__ = "cyi_progreso"

    id = Column(Integer, primary_key=True, index=True)
    candidato_id = Column(
        Integer, ForeignKey("candidatos.id", ondelete="CASCADE"), nullable=True, index=True
    )
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=True, index=True
    )

    etapa_id = Column(String(50), nullable=False, index=True)
    status = Column(String(20), default="pendiente", nullable=False)
    items = Column(JSON, nullable=False)
    notas = Column(String, nullable=True)

    candidato = relationship("Candidato", back_populates="progresos")
    empleado = relationship("Empleado")


class Evaluacion(Base, AuditoriaMixin):
    __tablename__ = "evaluaciones"

    id = Column(Integer, primary_key=True, index=True)
    pregunta = Column(String, nullable=True)
    tipo_evaluacion = Column(String(50), nullable=True)

    respuestas = relationship(
        "RespuestaEvaluacion", back_populates="evaluacion", cascade="all, delete-orphan"
    )


class RespuestaEvaluacion(Base, AuditoriaMixin):
    __tablename__ = "respuestas_evaluacion"

    id = Column(Integer, primary_key=True, index=True)
    pregunta_id = Column(Integer, ForeignKey("evaluaciones.id", ondelete="CASCADE"), nullable=False)
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False)
    respuesta = Column(String, nullable=True)

    evaluacion = relationship("Evaluacion", back_populates="respuestas")
    empleado = relationship("Empleado")


class CampaniaClima(Base, AuditoriaMixin):
    __tablename__ = "campania_clima"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    activa = Column(Boolean, default=True)

    respuestas = relationship(
        "RespuestaClima", back_populates="campania", cascade="all, delete-orphan"
    )


class PreguntaClima(Base, AuditoriaMixin):
    __tablename__ = "pregunta_clima"

    id = Column(Integer, primary_key=True, index=True)
    categoria = Column(String(100), nullable=False)
    pregunta = Column(String, nullable=False)


class RespuestaClima(Base, AuditoriaMixin):
    __tablename__ = "respuesta_clima"

    id = Column(Integer, primary_key=True, index=True)
    campania_id = Column(
        Integer, ForeignKey("campania_clima.id", ondelete="CASCADE"), nullable=False
    )
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False)

    nivel_jerarquico = Column(String(50), nullable=True)
    ubicacion = Column(String(50), nullable=True)

    respuestas_json = Column(JSON, nullable=False)

    campania = relationship("CampaniaClima", back_populates="respuestas")
    empleado = relationship("Empleado")
