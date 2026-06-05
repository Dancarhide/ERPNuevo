from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.models.base import AuditoriaMixin, Base


class Area(Base, AuditoriaMixin):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    nombre_area = Column(String(50), nullable=False)
    jefe_area_id = Column(
        Integer,
        ForeignKey("empleados.id", name="fk_area_jefe", use_alter=True, ondelete="SET NULL"),
        nullable=True,
    )

    empleados = relationship("Empleado", foreign_keys="[Empleado.area_id]", back_populates="area")
    jefe_de = relationship("Empleado", foreign_keys=[jefe_area_id], back_populates="area_liderada")
    puestos = relationship("Puesto", back_populates="area")
    roles = relationship("Rol", back_populates="area")


class Puesto(Base, AuditoriaMixin):
    __tablename__ = "puestos"

    id = Column(Integer, primary_key=True, index=True)
    nombre_puesto = Column(String(100), nullable=False)
    descripcion = Column(String, nullable=True)
    hierarchy_level = Column(Integer, default=10, nullable=False)
    cupo_maximo = Column(Integer, default=1, nullable=False)
    personal_actual = Column(Integer, default=0, nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    beneficios = Column(String, nullable=True)
    requisitos = Column(String, nullable=True)
    sueldo_min = Column(Numeric(10, 2), nullable=True)
    sueldo_max = Column(Numeric(10, 2), nullable=True)
    reporta_a_puesto_id = Column(
        Integer, ForeignKey("puestos.id", ondelete="SET NULL"), nullable=True
    )
    reporta_matricialmente_a_id = Column(
        Integer, ForeignKey("puestos.id", ondelete="SET NULL"), nullable=True
    )
    es_rol_staff = Column(Boolean, default=False, nullable=False)

    area = relationship("Area", back_populates="puestos")
    empleados = relationship("Empleado", back_populates="puesto")

    # Specify foreign keys to disambiguate the recursive relationships
    puesto_jefe = relationship(
        "Puesto",
        remote_side=[id],
        foreign_keys=[reporta_a_puesto_id],
        backref="puestos_subordinados",
    )
    puesto_jefe_matricial = relationship(
        "Puesto",
        remote_side=[id],
        foreign_keys=[reporta_matricialmente_a_id],
        backref="puestos_subordinados_matriciales",
    )


class Empleado(Base, AuditoriaMixin):
    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(255), nullable=False)
    curp = Column(String(18), nullable=True)
    rfc = Column(String(13), nullable=True)
    email = Column(String(50), nullable=True, unique=True, index=True)
    telefono = Column(String(12), nullable=True)
    direccion = Column(String(255), nullable=True)

    # Trabajo
    fecha_ingreso = Column(Date, nullable=True)
    estatus = Column(String(15), default="Activo", nullable=False)
    dias_vacaciones_disponibles = Column(Integer, default=12, nullable=False)
    sueldo = Column(Numeric(10, 2), default=0.00, nullable=False)
    sueldo_fiscal = Column(Numeric(10, 2), default=0.00, nullable=False)
    infonavit_mensual = Column(Numeric(10, 2), default=0.00, nullable=False)
    fondo_ahorro_pct = Column(Numeric(5, 2), default=0.00, nullable=False)
    vales_despensa_pct = Column(Numeric(5, 2), default=0.00, nullable=False)
    foto = Column(String, nullable=True)

    # Demografia
    ciudad = Column(String(100), nullable=True)
    colonia = Column(String(100), nullable=True)
    cp = Column(String(10), nullable=True)
    entidad_federativa = Column(String(100), nullable=True)
    estado_civil = Column(String(30), nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)
    lugar_nacimiento = Column(String(100), nullable=True)
    sexo = Column(String(10), nullable=True)
    ultimo_grado_escolar = Column(String(50), nullable=True)
    cartilla_militar = Column(Boolean, default=False, nullable=False)
    aspiraciones_profesionales = Column(String, nullable=True)

    # Foraneas
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)
    puesto_id = Column(Integer, ForeignKey("puestos.id", ondelete="SET NULL"), nullable=True)
    jefe_directo_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True
    )

    # Relaciones
    rol = relationship("Rol", back_populates="empleados")
    area = relationship("Area", foreign_keys=[area_id], back_populates="empleados")
    area_liderada = relationship(
        "Area", foreign_keys="[Area.jefe_area_id]", back_populates="jefe_de"
    )
    puesto = relationship("Puesto", back_populates="empleados")

    jefe_directo = relationship("Empleado", remote_side=[id], backref="subordinados")

    familiares = relationship(
        "EmpleadoFamiliar", back_populates="empleado", cascade="all, delete-orphan"
    )
    datos_salud = relationship(
        "EmpleadoSalud", back_populates="empleado", uselist=False, cascade="all, delete-orphan"
    )

    credencial = relationship(
        "Credencial", back_populates="empleado", uselist=False, cascade="all, delete-orphan"
    )
    empleado_permisos = relationship(
        "EmpleadoPermiso", back_populates="empleado", cascade="all, delete-orphan"
    )


class EmpleadoFamiliar(Base, AuditoriaMixin):
    __tablename__ = "empleados_familiar"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nombre_completo = Column(String(255), nullable=True)
    telefono = Column(String(12), nullable=True)
    email = Column(String(50), nullable=True)
    direccion = Column(String(255), nullable=True)
    parentesco = Column(String(30), nullable=True)

    empleado = relationship("Empleado", back_populates="familiares")


class EmpleadoSalud(Base, AuditoriaMixin):
    __tablename__ = "empleados_salud"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    discapacidad = Column(Boolean, default=False, nullable=False)
    desc_disc = Column(String, nullable=True)
    condicion = Column(Boolean, default=False, nullable=False)
    desc_cond = Column(String, nullable=True)
    tipo_sangre = Column(String(10), nullable=True)
    nss = Column(String(11), nullable=True)

    empleado = relationship("Empleado", back_populates="datos_salud")
