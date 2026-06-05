from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import AuditoriaMixin, Base


class Recurso(Base, AuditoriaMixin):
    __tablename__ = "recursos"

    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(100), nullable=False)

    permisos = relationship("Permiso", back_populates="recurso", cascade="all, delete-orphan")


class Permiso(Base, AuditoriaMixin):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True, index=True)
    recurso_id = Column(Integer, ForeignKey("recursos.id", ondelete="CASCADE"), nullable=False)
    accion = Column(String(50), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    nombre = Column(String(100), nullable=False)

    recurso = relationship("Recurso", back_populates="permisos")
    rol_permisos = relationship(
        "RolPermiso", back_populates="permiso", cascade="all, delete-orphan"
    )
    empleado_permisos = relationship(
        "EmpleadoPermiso", back_populates="permiso", cascade="all, delete-orphan"
    )


class Rol(Base, AuditoriaMixin):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre_rol = Column(String(50), nullable=False)
    descripcion = Column(String, nullable=True)
    es_sistema = Column(Boolean, default=False, nullable=False)
    nivel_jerarquia = Column(Integer, default=10, nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="SET NULL"), nullable=True)

    empleados = relationship("Empleado", back_populates="rol")
    rol_permisos = relationship("RolPermiso", back_populates="rol", cascade="all, delete-orphan")
    permisos_campo = relationship(
        "PermisoCampo", back_populates="rol", cascade="all, delete-orphan"
    )
    area = relationship("Area", back_populates="roles")


class RolPermiso(Base, AuditoriaMixin):
    __tablename__ = "rol_permisos"

    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permiso_id = Column(Integer, ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True)
    alcance = Column(String(20), default="global", nullable=False)

    rol = relationship("Rol", back_populates="rol_permisos")
    permiso = relationship("Permiso", back_populates="rol_permisos")


class EmpleadoPermiso(Base, AuditoriaMixin):
    __tablename__ = "empleado_permisos"

    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="CASCADE"), primary_key=True)
    permiso_id = Column(Integer, ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True)
    alcance = Column(String(20), default="global", nullable=False)
    concedido = Column(Boolean, default=True, nullable=False)

    empleado = relationship("Empleado", back_populates="empleado_permisos")
    permiso = relationship("Permiso", back_populates="empleado_permisos")


class PermisoCampo(Base, AuditoriaMixin):
    __tablename__ = "permisos_campo"

    id = Column(Integer, primary_key=True, index=True)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    clave_recurso = Column(String(50), nullable=False)
    clave_campo = Column(String(50), nullable=False)
    puede_leer = Column(Boolean, default=True, nullable=False)
    puede_escribir = Column(Boolean, default=False, nullable=False)

    rol = relationship("Rol", back_populates="permisos_campo")


class Credencial(Base, AuditoriaMixin):
    __tablename__ = "credenciales"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    nombre_usuario = Column(String(50), unique=True, nullable=False, index=True)
    contrasena_hasheada = Column(String, nullable=False)
    requiere_cambio_contrasena = Column(Boolean, default=True, nullable=False)

    empleado = relationship("Empleado", back_populates="credencial")


class DelegacionRol(Base, AuditoriaMixin):
    __tablename__ = "delegacion_roles"

    id = Column(Integer, primary_key=True, index=True)
    delegador_id = Column(Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False)
    delegado_id = Column(Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    estatus = Column(String(20), default="Activa", nullable=False)

    delegador = relationship("Empleado", foreign_keys=[delegador_id])
    delegado = relationship("Empleado", foreign_keys=[delegado_id])
    rol = relationship("Rol")
