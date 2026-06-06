from typing import Optional

from pydantic import BaseModel


class RolBase(BaseModel):
    nombre_rol: str
    descripcion: Optional[str] = None
    es_sistema: bool = False
    nivel_jerarquia: int = 10
    area_id: Optional[int] = None


class PermisoResponse(BaseModel):
    id: int
    accion: str
    slug: str
    nombre: str

    class Config:
        from_attributes = True


class RecursoResponse(BaseModel):
    id: int
    clave: str
    nombre: str
    permisos: list[PermisoResponse] = []

    class Config:
        from_attributes = True


class RolCreate(RolBase):
    permisos: Optional[list[int]] = []


class RolUpdate(BaseModel):
    nombre_rol: Optional[str] = None
    descripcion: Optional[str] = None
    nivel_jerarquia: Optional[int] = None
    area_id: Optional[int] = None
    permisos: Optional[list[int]] = None


class RolResponse(RolBase):
    id: int
    empleados_count: Optional[int] = None
    area_nombre: Optional[str] = None
    permisos: list[int] = []

    class Config:
        from_attributes = True


class AsignarRolRequest(BaseModel):
    empleado_id: int
    rol_id: int


class EmpleadoPermisoUpdate(BaseModel):
    permisos: dict[int, bool]  # dict[permiso_id, concedido]
