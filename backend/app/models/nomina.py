from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.models.base import AuditoriaMixin, Base


class LoteNomina(Base, AuditoriaMixin):
    __tablename__ = "lotes_nomina"

    id = Column(String(50), primary_key=True)
    periodo_inicio = Column(Date, nullable=False)
    periodo_fin = Column(Date, nullable=False)
    tipo_nomina = Column(String(20), nullable=True)
    total_lote = Column(Numeric(15, 2), nullable=False)
    estatus = Column(String(20), default="Borrador", nullable=False)
    creado_por_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True)

    creado_por = relationship("Empleado")
    nominas = relationship("Nomina", back_populates="lote_nomina", cascade="all, delete-orphan")


class Nomina(Base, AuditoriaMixin):
    __tablename__ = "nominas"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lote_id = Column(
        String(50), ForeignKey("lotes_nomina.id", ondelete="CASCADE"), nullable=True, index=True
    )

    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    sueldo_base = Column(Numeric(10, 2), nullable=False)
    bonos = Column(Numeric(10, 2), default=0.00, nullable=False)
    deducciones = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_pagado = Column(Numeric(10, 2), nullable=False)

    metodo_pago = Column(String(50), nullable=True)
    estado = Column(String(20), default="Pagado", nullable=False)

    monto_reportado_fiscal = Column(Numeric(10, 2), default=0.00, nullable=False)
    monto_variacion_complemento = Column(Numeric(10, 2), default=0.00, nullable=False)
    dias_trabajados = Column(Integer, default=15, nullable=False)
    sdi = Column(Numeric(10, 2), default=0.00, nullable=False)
    factor_integracion = Column(Numeric(10, 4), default=1.0493, nullable=False)
    costo_patronal = Column(Numeric(10, 2), default=0.00, nullable=False)

    certificado_sat = Column(String, nullable=True)
    estatus_sat = Column(String(50), default="Pendiente", nullable=False)
    pdf_url = Column(String, nullable=True)
    sello_sat = Column(String, nullable=True)
    uuid_sat = Column(String(100), nullable=True)
    xml_url = Column(String, nullable=True)

    lote_nomina = relationship("LoteNomina", back_populates="nominas")
    empleado = relationship("Empleado", backref="nominas")
    detalles = relationship("DetalleNomina", back_populates="nomina", cascade="all, delete-orphan")


class ConceptoNomina(Base, AuditoriaMixin):
    __tablename__ = "conceptos_nomina"

    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(20), unique=True, nullable=False)
    nombre_concepto = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False)
    monto_defecto = Column(Numeric(10, 2), default=0.00, nullable=False)
    es_fiscal = Column(Boolean, default=False, nullable=False)

    detalles = relationship("DetalleNomina", back_populates="concepto")


class DetalleNomina(Base, AuditoriaMixin):
    __tablename__ = "detalles_nomina"

    id = Column(Integer, primary_key=True, index=True)
    nomina_id = Column(
        Integer, ForeignKey("nominas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    concepto_id = Column(
        Integer, ForeignKey("conceptos_nomina.id", ondelete="CASCADE"), nullable=False, index=True
    )
    monto_aplicado = Column(Numeric(10, 2), nullable=False)

    nomina = relationship("Nomina", back_populates="detalles")
    concepto = relationship("ConceptoNomina", back_populates="detalles")


class Prestamo(Base, AuditoriaMixin):
    __tablename__ = "prestamos"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False, index=True
    )
    monto_total = Column(Numeric(10, 2), nullable=False)
    saldo_pendiente = Column(Numeric(10, 2), nullable=False)
    abono_periodo = Column(Numeric(10, 2), nullable=False)
    estatus = Column(String(20), default="Activo", nullable=False)
    notas = Column(String, nullable=True)

    empleado = relationship("Empleado", backref="prestamos")
