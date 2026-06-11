from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class VacanteBase(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    area_id: Optional[int] = Field(None, alias="idarea")
    rol_id: Optional[int] = None
    puesto_id: Optional[int] = Field(None, alias="idpuesto")
    cantidad_solicitada: int
    cantidad_contratada: int = 0
    estatus: str = "Abierta"


class VacanteCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    idarea: Optional[int] = None
    idpuesto: Optional[int] = None
    cantidad_solicitada: int
    cantidad_contratada: int = 0
    estatus: str = "Abierta"


class VacanteUpdate(BaseModel):
    pass


class PuestoSimple(BaseModel):
    nombre_puesto: str

    class Config:
        from_attributes = True
        populate_by_name = True


class AreaSimple(BaseModel):
    nombre_area: str

    class Config:
        from_attributes = True
        populate_by_name = True


class Vacante(BaseModel):
    idvacante: int = Field(alias="id")
    titulo: str
    descripcion: Optional[str] = None
    idarea: Optional[int] = Field(None, alias="area_id")
    idpuesto: Optional[int] = Field(None, alias="puesto_id")
    cantidad_solicitada: int
    cantidad_contratada: int = 0
    estatus: str = "Abierta"

    puestos: Optional[PuestoSimple] = Field(None, alias="puesto")
    areas: Optional[AreaSimple] = Field(None, alias="area")

    class Config:
        from_attributes = True
        populate_by_name = True


class CandidatoCreate(BaseModel):
    nombre_completo: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    cv_url: Optional[str] = None
    idvacante: Optional[int] = None
    idpuesto: Optional[int] = None
    estatus: str = "Postulado"
    notas: Optional[str] = None


class CandidatoUpdateStatus(BaseModel):
    estatus: str


class VacanteSimple(BaseModel):
    titulo: str

    class Config:
        from_attributes = True
        populate_by_name = True


class Candidato(BaseModel):
    idcandidato: int = Field(alias="id")
    nombre_completo: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    cv_url: Optional[str] = None
    idvacante: Optional[int] = Field(None, alias="vacante_id")
    idpuesto: Optional[int] = Field(None, alias="puesto_id")
    estatus: str = "Postulado"
    notas: Optional[str] = None

    puestos: Optional[PuestoSimple] = Field(None, alias="puesto")
    vacantes: Optional[VacanteSimple] = Field(None, alias="vacante")

    class Config:
        from_attributes = True
        populate_by_name = True
