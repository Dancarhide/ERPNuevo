from typing import Optional

from pydantic import BaseModel


class AreaBase(BaseModel):
    nombre_area: str
    jefe_area_id: Optional[int] = None


class AreaCreate(AreaBase):
    pass


class AreaUpdate(AreaBase):
    nombre_area: str | None = None  # type: ignore[assignment]


class AreaResponse(AreaBase):
    id: int

    class Config:
        from_attributes = True
