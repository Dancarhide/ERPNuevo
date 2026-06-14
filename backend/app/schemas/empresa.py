from typing import List, Optional

from pydantic import BaseModel


class InfoEmpresaBase(BaseModel):
    nombre: Optional[str] = None
    rfc: Optional[str] = None
    regimen_fiscal: Optional[str] = None
    cp_fiscal: Optional[str] = None
    mision: Optional[str] = None
    vision: Optional[str] = None
    historia: Optional[str] = None
    valores: Optional[List[str]] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    periodicidad_nomina: Optional[str] = "Quincenal"
    registro_patronal: Optional[str] = None


class InfoEmpresaCreate(InfoEmpresaBase):
    pass


class InfoEmpresaUpdate(InfoEmpresaBase):
    pass


class InfoEmpresaResponse(InfoEmpresaBase):
    id: int

    class Config:
        from_attributes = True
