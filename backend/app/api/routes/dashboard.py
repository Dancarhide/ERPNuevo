from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.dashboard import ConfiguracionDashboard
from app.models.empleados import Empleado
from app.schemas.dashboard import DashboardConfigResponse, DashboardConfigUpdate

router = APIRouter()


@router.get("/config", response_model=DashboardConfigResponse)
async def get_dashboard_config(
    current_user: Annotated[Empleado, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Obtiene la configuración del dashboard para el usuario actual.
    Si no existe, crea una configuración vacía.
    """
    res = await session.execute(
        select(ConfiguracionDashboard).where(ConfiguracionDashboard.empleado_id == current_user.id)
    )
    config = res.scalars().first()

    if not config:
        config = ConfiguracionDashboard(empleado_id=current_user.id, layout_json=[])
        session.add(config)
        await session.commit()
        await session.refresh(config)

    return config


@router.put("/config", response_model=DashboardConfigResponse)
async def update_dashboard_config(
    data: DashboardConfigUpdate,
    current_user: Annotated[Empleado, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Actualiza la configuración del dashboard del usuario actual.
    """
    res = await session.execute(
        select(ConfiguracionDashboard).where(ConfiguracionDashboard.empleado_id == current_user.id)
    )
    config = res.scalars().first()

    if not config:
        config = ConfiguracionDashboard(empleado_id=current_user.id, layout_json=data.layout_json)
        session.add(config)
    else:
        config.layout_json = data.layout_json

    await session.commit()
    await session.refresh(config)

    return config
