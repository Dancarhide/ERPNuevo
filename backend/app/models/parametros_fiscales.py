from sqlalchemy import Column, Integer, Numeric, String

from app.models.base import AuditoriaMixin, Base


class ParametroFiscal(Base, AuditoriaMixin):
    __tablename__ = "parametros_fiscales"

    id = Column(Integer, primary_key=True, index=True)
    ejercicio = Column(Integer, unique=True, nullable=False, index=True)  # e.g. 2024
    uma = Column(Numeric(10, 2), nullable=False)
    salario_minimo_general = Column(Numeric(10, 2), nullable=False)
    salario_minimo_frontera = Column(Numeric(10, 2), nullable=False)
    umi = Column(Numeric(10, 4), default=0.00, nullable=False)

    # JSON-encoded array for ISR tables
    tabla_isr_mensual = Column(String, nullable=False)


class PoliticaVacacional(Base, AuditoriaMixin):
    __tablename__ = "politicas_vacacionales"

    id = Column(Integer, primary_key=True, index=True)
    anios_desde = Column(Integer, nullable=False)
    anios_hasta = Column(Integer, nullable=False)
    dias_otorgados = Column(Integer, nullable=False)
