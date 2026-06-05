from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empleados import Area, Empleado
from app.schemas.areas import AreaCreate, AreaResponse, AreaUpdate

router = APIRouter()


@router.get("", response_model=List[AreaResponse])
async def read_areas(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(Area))
    return result.scalars().all()


@router.post("", response_model=AreaResponse, status_code=status.HTTP_201_CREATED)
async def create_area(
    area_in: AreaCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    new_area = Area(nombre_area=area_in.nombre_area, jefe_area_id=area_in.jefe_area_id)
    session.add(new_area)
    await session.commit()
    await session.refresh(new_area)
    return new_area


@router.put("/{area_id}", response_model=AreaResponse)
async def update_area(
    area_id: int,
    area_in: AreaUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(Area).where(Area.id == area_id))
    area = result.scalar_one_or_none()
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada")

    if area_in.nombre_area is not None:
        area.nombre_area = str(area_in.nombre_area)  # type: ignore[assignment]
    if area_in.jefe_area_id is not None:
        area.jefe_area_id = int(area_in.jefe_area_id)  # type: ignore[assignment]

    await session.commit()
    await session.refresh(area)
    return area


@router.delete("/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_area(
    area_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> None:
    result = await session.execute(select(Area).where(Area.id == area_id))
    area = result.scalar_one_or_none()
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada")

    await session.delete(area)
    await session.commit()
