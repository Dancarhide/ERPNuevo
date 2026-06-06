from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, EmailStr


class EmpleadoFamiliarBase(BaseModel):
    nombre_completo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    parentesco: Optional[str] = None


class EmpleadoFamiliarCreate(EmpleadoFamiliarBase):
    pass


class EmpleadoSaludBase(BaseModel):
    discapacidad: bool = False
    desc_disc: Optional[str] = None
    condicion: bool = False
    desc_cond: Optional[str] = None
    tipo_sangre: Optional[str] = None
    nss: Optional[str] = None


class EmpleadoSaludCreate(EmpleadoSaludBase):
    pass


class EmpleadoBase(BaseModel):
    nombre_completo: str
    curp: Optional[str] = None
    rfc: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    estatus: str = "Activo"
    dias_vacaciones_disponibles: int = 12
    sueldo: Decimal = Decimal("0.00")
    sueldo_fiscal: Decimal = Decimal("0.00")
    infonavit_mensual: Decimal = Decimal("0.00")
    fondo_ahorro_pct: Decimal = Decimal("0.00")
    vales_despensa_pct: Decimal = Decimal("0.00")
    ciudad: Optional[str] = None
    colonia: Optional[str] = None
    cp: Optional[str] = None
    entidad_federativa: Optional[str] = None
    estado_civil: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    lugar_nacimiento: Optional[str] = None
    sexo: Optional[str] = None
    ultimo_grado_escolar: Optional[str] = None
    cartilla_militar: bool = False
    aspiraciones_profesionales: Optional[str] = None
    rol_id: Optional[int] = None
    area_id: Optional[int] = None
    puesto_id: Optional[int] = None
    jefe_directo_id: Optional[int] = None


class EmpleadoCreate(EmpleadoBase):
    familiares: Optional[List[EmpleadoFamiliarCreate]] = []
    datos_salud: Optional[EmpleadoSaludCreate] = None


class EmpleadoUpdate(EmpleadoBase):
    nombre_completo: str | None = None  # type: ignore[assignment]
    familiares: list[EmpleadoFamiliarCreate] | None = None
    datos_salud: EmpleadoSaludCreate | None = None


class AreaMin(BaseModel):
    id: int
    nombre_area: str

    class Config:
        from_attributes = True


class PuestoMin(BaseModel):
    id: int
    nombre_puesto: str

    class Config:
        from_attributes = True


class EmpleadoMin(BaseModel):
    id: int
    nombre_completo: str

    class Config:
        from_attributes = True


class EmpleadoResponse(EmpleadoBase):
    id: int
    familiares: Optional[List[EmpleadoFamiliarCreate]] = []
    datos_salud: Optional[EmpleadoSaludCreate] = None
    password_temporal: Optional[str] = None
    area: Optional[AreaMin] = None
    puesto: Optional[PuestoMin] = None
    jefe_directo: Optional[EmpleadoMin] = None

    class Config:
        from_attributes = True


class EmpleadosListResponse(BaseModel):
    items: List[EmpleadoResponse]
    total: int
    page: int
    size: int
