from typing import List, Optional

from pydantic import BaseModel


class InfoEmpresaBase(BaseModel):
    mision: Optional[str] = None
    vision: Optional[str] = None
    historia: Optional[str] = None
    valores: Optional[List[str]] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None


class InfoEmpresaCreate(InfoEmpresaBase):
    pass


class InfoEmpresaUpdate(InfoEmpresaBase):
    pass


class InfoEmpresaResponse(InfoEmpresaBase):
    id: int

    class Config:
        from_attributes = True
