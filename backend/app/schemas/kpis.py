from typing import List

from pydantic import BaseModel


class ChartDataPoint(BaseModel):
    name: str
    value: float


class HeadcountKPIResponse(BaseModel):
    total_activos: int
    antiguedad_promedio_anios: float
    por_genero: List[ChartDataPoint]
    por_area: List[ChartDataPoint]


class PayrollKPIResponse(BaseModel):
    nomina_mensual_total: float
    sueldo_promedio_area: List[ChartDataPoint]


class IncidenciasKPIResponse(BaseModel):
    total_activas: int
    por_estatus: List[ChartDataPoint]
