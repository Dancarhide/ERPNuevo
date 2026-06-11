from sqlalchemy import JSON, Column, Integer, String

from app.models.base import Base


class InfoEmpresa(Base):
    __tablename__ = "info_empresa"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=True)
    rfc = Column(String(13), nullable=True)
    regimen_fiscal = Column(String(100), nullable=True)
    cp_fiscal = Column(String(10), nullable=True)
    mision = Column(String, nullable=True)
    vision = Column(String, nullable=True)
    historia = Column(String, nullable=True)
    valores = Column(JSON, nullable=True)
    logo_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    # Nómina
    periodicidad_nomina = Column(String(20), default="Quincenal", nullable=False)
