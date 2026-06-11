from typing import List

from pydantic import BaseModel


class DashboardConfigResponse(BaseModel):
    empleado_id: int
    layout_json: List[str]

    class Config:
        from_attributes = True


class DashboardConfigUpdate(BaseModel):
    layout_json: List[str]
