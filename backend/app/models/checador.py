import enum
from typing import Any

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String

from app.models.base import Base


class MarcaDispositivo(str, enum.Enum):
    ZKTECO = "ZKTECO"
    HIKVISION = "HIKVISION"
    SUPREMA = "SUPREMA"
    OTRA = "OTRA"


class MetodoConexion(str, enum.Enum):
    PULL_IP = "PULL_IP"  # Pasivo: El ERP busca al checador en su IP local
    PUSH_WEBHOOK = "PUSH_WEBHOOK"  # Activo: El checador hace POST al ERP


class DispositivoBiometrico(Base):
    __tablename__ = "dispositivos_biometricos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    marca: Any = Column(Enum(MarcaDispositivo), default=MarcaDispositivo.OTRA)
    metodo_conexion: Any = Column(Enum(MetodoConexion), default=MetodoConexion.PUSH_WEBHOOK)

    # Para Modo PULL_IP
    ip_address = Column(String, nullable=True)
    puerto = Column(Integer, default=4370, nullable=True)

    # Para Modo PUSH_WEBHOOK
    token_auth = Column(String, unique=True, index=True, nullable=True)

    ultima_sincronizacion = Column(DateTime, nullable=True)
    activo = Column(Boolean, default=True)
