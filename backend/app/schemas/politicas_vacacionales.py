from pydantic import BaseModel, Field


class PoliticaVacacionalBase(BaseModel):
    anios_desde: int = Field(..., description="Año de antigüedad inicial")
    anios_hasta: int = Field(..., description="Año de antigüedad final")
    dias_otorgados: int = Field(..., description="Días de vacaciones otorgados")
    activo: bool = True


class PoliticaVacacionalCreate(PoliticaVacacionalBase):
    pass


class PoliticaVacacionalUpdate(BaseModel):
    anios_desde: int | None = None
    anios_hasta: int | None = None
    dias_otorgados: int | None = None
    activo: bool | None = None


class PoliticaVacacionalResponse(PoliticaVacacionalBase):
    id: int

    class Config:
        from_attributes = True
