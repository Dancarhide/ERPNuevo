from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empleados import Area, Empleado, Puesto

router = APIRouter()


@router.get("")
async def get_organigrama(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Obtener todas las áreas
    areas_result = await session.execute(select(Area))
    areas = areas_result.scalars().all()

    # Obtener todos los puestos con sus empleados activos
    puestos_result = await session.execute(select(Puesto).options(selectinload(Puesto.empleados)))
    all_puestos = puestos_result.scalars().all()

    # Omitir puestos con nombre "Super Admin"
    puestos = [
        p
        for p in all_puestos
        if not ("super" in p.nombre_puesto.lower() and "admin" in p.nombre_puesto.lower())
    ]

    resultado: dict[str, Any] = {"areas": [], "sinArea": []}

    def format_empleado(emp: Empleado) -> dict[str, Any]:
        return {"id": emp.id, "nombre": emp.nombre_completo, "estatus": emp.estatus}

    def format_puesto(p: Puesto) -> dict[str, Any]:
        empleados_activos = [e for e in p.empleados if e.estatus == "Activo"]
        return {
            "id": p.id,
            "nombre_puesto": p.nombre_puesto,
            "hierarchyLevel": p.hierarchy_level or 99,
            "reporta_a_puesto_id": p.reporta_a_puesto_id,
            "reporta_matricialmente_a_id": getattr(p, "reporta_matricialmente_a_id", None),
            "es_rol_staff": getattr(p, "es_rol_staff", False),
            "empleados": [format_empleado(e) for e in empleados_activos],
        }

    puestos_por_area: dict[int, list[dict[str, Any]]] = {}
    sin_area: list[dict[str, Any]] = []

    for p in puestos:
        fmt = format_puesto(p)
        area_id = int(p.area_id) if p.area_id else None
        if area_id:
            if area_id not in puestos_por_area:
                puestos_por_area[area_id] = []
            puestos_por_area[area_id].append(fmt)
        else:
            sin_area.append(fmt)

    for area in areas:
        area_id = int(area.id)
        resultado["areas"].append(
            {
                "id": area.id,
                "nombre": area.nombre_area,
                "puestos": puestos_por_area.get(area_id, []),
            }
        )

    resultado["sinArea"] = sin_area
    return resultado
