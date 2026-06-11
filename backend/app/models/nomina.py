from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.models.base import AuditoriaMixin, Base


class LoteNomina(Base, AuditoriaMixin):
    """
    Un Lote de Nómina agrupa todos los recibos de un período de pago.
    Ej: 'Quincena 1 de Enero 2025'.
    """

    __tablename__ = "lotes_nomina"

    id = Column(String(50), primary_key=True)
    descripcion = Column(String(200), nullable=True)
    periodicidad = Column(
        String(20), nullable=False, default="Quincenal"
    )  # Semanal, Quincenal, Mensual
    numero_periodo = Column(Integer, nullable=True)  # Ej: 1, 2, 3... (quincena 1, 2, etc)
    año = Column(Integer, nullable=True)
    periodo_inicio = Column(Date, nullable=False)
    periodo_fin = Column(Date, nullable=False)
    tipo_nomina = Column(String(20), nullable=True)  # Ordinaria, Finiquito, Aguinaldo, etc.
    numero_empleados = Column(Integer, default=0, nullable=False)
    total_percepciones = Column(Numeric(15, 2), default=0.00, nullable=False)
    total_deducciones = Column(Numeric(15, 2), default=0.00, nullable=False)
    total_neto = Column(Numeric(15, 2), default=0.00, nullable=False)
    total_lote = Column(Numeric(15, 2), nullable=False, default=0.00)  # Retrocompat
    estatus = Column(String(20), default="Borrador", nullable=False)  # Borrador, Procesado, Cerrado
    creado_por_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"), nullable=True)

    creado_por = relationship("Empleado", foreign_keys=[creado_por_id])
    nominas = relationship("Nomina", back_populates="lote_nomina", cascade="all, delete-orphan")


class Nomina(Base, AuditoriaMixin):
    """
    Recibo de nómina individual de un empleado en un período.
    """

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
    periodicidad = Column(String(20), nullable=False, default="Quincenal")

    # Montos principales (el contador los ingresa / el sistema los suma de los detalles)
    sueldo_base = Column(Numeric(10, 2), nullable=False, default=0.00)
    dias_trabajados = Column(Integer, default=15, nullable=False)

    # Totales calculados de los conceptos
    subtotal_percepciones = Column(Numeric(10, 2), default=0.00, nullable=False)
    subtotal_deducciones = Column(Numeric(10, 2), default=0.00, nullable=False)
    subtotal_otros = Column(Numeric(10, 2), default=0.00, nullable=False)
    neto_pagar = Column(Numeric(10, 2), nullable=False, default=0.00)

    # Campos retrocompatibles
    bonos = Column(Numeric(10, 2), default=0.00, nullable=False)
    deducciones = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_pagado = Column(Numeric(10, 2), nullable=False, default=0.00)

    metodo_pago = Column(String(50), nullable=True)
    estado = Column(String(20), default="Borrador", nullable=False)  # Borrador, Pagado, Cancelado

    # Campos fiscales / IMSS
    monto_reportado_fiscal = Column(Numeric(10, 2), default=0.00, nullable=False)
    monto_variacion_complemento = Column(Numeric(10, 2), default=0.00, nullable=False)
    sdi = Column(Numeric(10, 2), default=0.00, nullable=False)  # Salario Diario Integrado
    factor_integracion = Column(Numeric(10, 4), default=1.0493, nullable=False)
    costo_patronal = Column(Numeric(10, 2), default=0.00, nullable=False)

    # CFDI / SAT
    certificado_sat = Column(String, nullable=True)
    estatus_sat = Column(
        String(50), default="Pendiente", nullable=False
    )  # Pendiente, Timbrado, Cancelado
    pdf_url = Column(String, nullable=True)
    sello_sat = Column(String, nullable=True)
    uuid_sat = Column(String(100), nullable=True)
    xml_url = Column(String, nullable=True)
    xml_cfdi_content = Column(Text, nullable=True)  # Contenido del XML CFDI generado

    # Notas internas
    observaciones = Column(String, nullable=True)

    lote_nomina = relationship("LoteNomina", back_populates="nominas")
    empleado = relationship("Empleado", backref="nominas")
    detalles = relationship("DetalleNomina", back_populates="nomina", cascade="all, delete-orphan")


class ConceptoNomina(Base, AuditoriaMixin):
    """
    Catálogo de conceptos de nómina (percepciones, deducciones, otros).
    Basado en los catálogos del SAT para el CFDI de nómina.
    """

    __tablename__ = "conceptos_nomina"

    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(20), unique=True, nullable=False)
    clave_sat = Column(String(10), nullable=True)  # Clave oficial SAT (ej. '001' para Sueldos)
    nombre_concepto = Column(String(100), nullable=False)
    tipo = Column(String(20), nullable=False)  # Percepcion, Deduccion, OtroPago
    tipo_sat = Column(String(1), nullable=True)  # P = Percepción, D = Deducción, O = Otro Pago
    monto_defecto = Column(Numeric(10, 2), default=0.00, nullable=False)
    es_fiscal = Column(Boolean, default=False, nullable=False)
    es_exento = Column(Boolean, default=False, nullable=False)  # Exento de ISR
    es_obligatorio = Column(
        Boolean, default=False, nullable=False
    )  # Se aplica siempre (ej. sueldo base)
    activo = Column(Boolean, default=True, nullable=False)

    detalles = relationship("DetalleNomina", back_populates="concepto")


class DetalleNomina(Base, AuditoriaMixin):
    """
    Línea individual de un recibo: la aplicación de un concepto a una nómina.
    """

    __tablename__ = "detalles_nomina"

    id = Column(Integer, primary_key=True, index=True)
    nomina_id = Column(
        Integer, ForeignKey("nominas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    concepto_id = Column(
        Integer, ForeignKey("conceptos_nomina.id", ondelete="CASCADE"), nullable=False, index=True
    )
    monto_aplicado = Column(Numeric(10, 2), nullable=False)
    descripcion_extra = Column(String(200), nullable=True)  # Notas adicionales en la línea

    nomina = relationship("Nomina", back_populates="detalles")
    concepto = relationship("ConceptoNomina", back_populates="detalles")


class Prestamo(Base, AuditoriaMixin):
    """
    Préstamo personal a un empleado con descuento por nómina.
    """

    __tablename__ = "prestamos"

    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(
        Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False, index=True
    )
    monto_total = Column(Numeric(10, 2), nullable=False)
    saldo_pendiente = Column(Numeric(10, 2), nullable=False)
    abono_periodo = Column(Numeric(10, 2), nullable=False)
    estatus = Column(String(20), default="Activo", nullable=False)  # Activo, Liquidado, Cancelado
    notas = Column(String, nullable=True)
    fecha_inicio = Column(Date, nullable=True)

    empleado = relationship("Empleado", backref="prestamos")
