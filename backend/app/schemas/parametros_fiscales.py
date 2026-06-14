from decimal import Decimal

from pydantic import BaseModel, Field


class ParametrosFiscalesBase(BaseModel):
    ejercicio: int = Field(..., description="Año fiscal (ej. 2024)")
    uma: Decimal = Field(..., description="Unidad de Medida y Actualización diaria")
    salario_minimo_general: Decimal = Field(..., description="Salario mínimo general diario")
    salario_minimo_frontera: Decimal = Field(..., description="Salario mínimo zona frontera")
    tabla_isr_mensual: str = Field(..., description="JSON string con las tarifas mensuales de ISR")


class ParametrosFiscalesCreate(ParametrosFiscalesBase):
    pass


class ParametrosFiscalesUpdate(BaseModel):
    uma: Decimal | None = None
    salario_minimo_general: Decimal | None = None
    salario_minimo_frontera: Decimal | None = None
    tabla_isr_mensual: str | None = None


class ParametrosFiscalesResponse(ParametrosFiscalesBase):
    id: int

    class Config:
        from_attributes = True
