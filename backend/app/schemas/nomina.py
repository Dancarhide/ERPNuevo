from datetime import date
from decimal import Decimal
from typing import Any, List, Optional

from pydantic import BaseModel, field_validator

# ─── Conceptos de Nómina ────────────────────────────────────────────────────


class ConceptoNominaBase(BaseModel):
    clave: str
    clave_sat: Optional[str] = None
    nombre_concepto: str
    tipo: str  # Percepcion, Deduccion, OtroPago
    tipo_sat: Optional[str] = None  # P, D, O
    monto_defecto: Decimal = Decimal("0.00")
    es_fiscal: bool = False
    es_exento: bool = False
    es_obligatorio: bool = False
    activo: bool = True


class ConceptoNominaCreate(ConceptoNominaBase):
    pass


class ConceptoNominaUpdate(ConceptoNominaBase):
    clave: Optional[str] = None
    nombre_concepto: Optional[str] = None
    tipo: Optional[str] = None


class ConceptoNominaResponse(ConceptoNominaBase):
    id: int

    class Config:
        from_attributes = True


# ─── Detalle de Nómina (líneas del recibo) ───────────────────────────────────


class DetalleNominaCreate(BaseModel):
    concepto_id: int
    monto_aplicado: Decimal
    descripcion_extra: Optional[str] = None


class DetalleNominaResponse(BaseModel):
    id: int
    concepto_id: int
    concepto: ConceptoNominaResponse
    monto_aplicado: Decimal
    descripcion_extra: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Nómina Individual (Recibo) ───────────────────────────────────────────────


class NominaBase(BaseModel):
    empleado_id: int
    lote_id: Optional[str] = None
    fecha_inicio: date
    fecha_fin: date
    periodicidad: str = "Quincenal"
    sueldo_base: Decimal = Decimal("0.00")
    dias_trabajados: int = 15
    sdi: Decimal = Decimal("0.00")
    factor_integracion: Decimal = Decimal("1.0493")
    metodo_pago: Optional[str] = None
    observaciones: Optional[str] = None


class NominaCreate(NominaBase):
    detalles: List[DetalleNominaCreate] = []


class NominaUpdate(BaseModel):
    sueldo_base: Optional[Decimal] = None
    dias_trabajados: Optional[int] = None
    sdi: Optional[Decimal] = None
    factor_integracion: Optional[Decimal] = None
    metodo_pago: Optional[str] = None
    observaciones: Optional[str] = None
    estado: Optional[str] = None
    detalles: Optional[List[DetalleNominaCreate]] = None


class EmpleadoMinNomina(BaseModel):
    id: int
    nombre_completo: str
    rfc: Optional[str] = None
    curp: Optional[str] = None
    numero_seguro_social: Optional[str] = None
    area: Optional[str] = None
    puesto: Optional[str] = None

    @field_validator("area", mode="before")
    def extract_area_name(cls, v: Any) -> Optional[str]:
        if v and hasattr(v, "nombre_area"):
            return str(v.nombre_area)
        return str(v) if isinstance(v, str) else None

    @field_validator("puesto", mode="before")
    def extract_puesto_name(cls, v: Any) -> Optional[str]:
        if v and hasattr(v, "nombre_puesto"):
            return str(v.nombre_puesto)
        return str(v) if isinstance(v, str) else None

    class Config:
        from_attributes = True


class NominaResponse(NominaBase):
    id: int
    subtotal_percepciones: Decimal = Decimal("0.00")
    subtotal_deducciones: Decimal = Decimal("0.00")
    subtotal_otros: Decimal = Decimal("0.00")
    neto_pagar: Decimal = Decimal("0.00")
    estado: str
    estatus_sat: str
    uuid_sat: Optional[str] = None
    empleado: Optional[EmpleadoMinNomina] = None
    detalles: List[DetalleNominaResponse] = []

    class Config:
        from_attributes = True


class NominaListItem(BaseModel):
    """Vista compacta de un recibo en la lista del lote."""

    id: int
    empleado_id: int
    empleado_nombre: str
    sueldo_base: Decimal
    subtotal_percepciones: Decimal
    subtotal_deducciones: Decimal
    neto_pagar: Decimal
    dias_trabajados: int
    estado: str
    estatus_sat: str

    class Config:
        from_attributes = True


# ─── Lote de Nómina ──────────────────────────────────────────────────────────


class LoteNominaCreate(BaseModel):
    id: str  # El usuario/sistema proporciona el ID (ej. "2025-Q01")
    descripcion: Optional[str] = None
    periodicidad: str = "Quincenal"
    numero_periodo: Optional[int] = None
    año: Optional[int] = None
    periodo_inicio: date
    periodo_fin: date
    tipo_nomina: str = "Ordinaria"  # Ordinaria, Aguinaldo, Finiquito, PTU, etc.


class LoteNominaResponse(BaseModel):
    id: str
    descripcion: Optional[str] = None
    periodicidad: str
    numero_periodo: Optional[int] = None
    año: Optional[int] = None
    periodo_inicio: date
    periodo_fin: date
    tipo_nomina: Optional[str] = None
    numero_empleados: int
    total_percepciones: Decimal
    total_deducciones: Decimal
    total_neto: Decimal
    estatus: str

    class Config:
        from_attributes = True


class LoteNominaDetalle(LoteNominaResponse):
    """Detalle del lote con la lista de nóminas incluidas."""

    nominas: List[NominaListItem] = []

    class Config:
        from_attributes = True


class LoteNominaProcesarRequest(BaseModel):
    """Request para procesar (generar) las nóminas de un lote para todos los empleados activos."""

    aplicar_conceptos_obligatorios: bool = True


# ─── Recibo XML / PDF ────────────────────────────────────────────────────────


class ReciboXMLResponse(BaseModel):
    nomina_id: int
    xml_content: str
    uuid_sat: Optional[str] = None


class ReciboPDFResponse(BaseModel):
    nomina_id: int
    html_content: str  # HTML del recibo para imprimir en el cliente
