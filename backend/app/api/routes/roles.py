from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import RequirePermission, get_current_user
from app.core.database import get_db
from app.models.empleados import Empleado
from app.models.seguridad import EmpleadoPermiso, Recurso, Rol, RolPermiso
from app.schemas.roles import (
    AsignarRolRequest,
    EmpleadoPermisoUpdate,
    RecursoResponse,
    RolCreate,
    RolResponse,
    RolUpdate,
)

router = APIRouter()


@router.get("/recursos/permisos", response_model=list[RecursoResponse])
async def get_recursos_permisos(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
) -> Any:
    # Obtenemos todos los recursos con sus permisos
    query = select(Recurso).options(selectinload(Recurso.permisos))
    result = await session.execute(query)
    recursos = result.scalars().all()
    return recursos


@router.get("", response_model=list[RolResponse])
async def get_roles(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("ver_configuracion"))],
) -> Any:
    # Obtener roles junto con su área, contar empleados y obtener permisos
    query = (
        select(Rol)
        .options(
            selectinload(Rol.area), selectinload(Rol.empleados), selectinload(Rol.rol_permisos)
        )
        .where(Rol.es_sistema.is_(False))
    )
    result = await session.execute(query)
    roles = result.scalars().all()

    respuestas = []
    for r in roles:
        resp = RolResponse.model_validate(r)
        resp.area_nombre = str(r.area.nombre_area) if r.area else None
        resp.empleados_count = len(r.empleados) if r.empleados else 0
        resp.permisos = [rp.permiso_id for rp in r.rol_permisos]
        respuestas.append(resp)

    return respuestas


@router.post("", response_model=RolResponse)
async def create_rol(
    rol_in: RolCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("gestionar_roles"))],
) -> Any:
    data = rol_in.model_dump(exclude={"permisos"})
    new_rol = Rol(**data)
    session.add(new_rol)
    await session.flush()  # Para obtener el ID

    if rol_in.permisos:
        for p_id in rol_in.permisos:
            rp = RolPermiso(rol_id=new_rol.id, permiso_id=p_id)
            session.add(rp)

    await session.commit()
    await session.refresh(new_rol)

    # Reload with area and permisos
    result = await session.execute(
        select(Rol)
        .options(selectinload(Rol.area), selectinload(Rol.rol_permisos))
        .where(Rol.id == new_rol.id)
    )
    new_rol = result.scalar_one()

    resp = RolResponse.model_validate(new_rol)
    resp.area_nombre = str(new_rol.area.nombre_area) if new_rol.area else None
    resp.empleados_count = 0
    resp.permisos = [rp.permiso_id for rp in new_rol.rol_permisos]
    return resp


@router.put("/{rol_id}", response_model=RolResponse)
async def update_rol(
    rol_id: int,
    rol_in: RolUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(RequirePermission("gestionar_roles"))],
) -> Any:
    result = await session.execute(
        select(Rol)
        .options(
            selectinload(Rol.area), selectinload(Rol.empleados), selectinload(Rol.rol_permisos)
        )
        .where(Rol.id == rol_id)
    )
    rol = result.scalar_one_or_none()

    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    update_data = rol_in.model_dump(exclude_unset=True, exclude={"permisos"})
    for field, value in update_data.items():
        setattr(rol, field, value)

    if rol_in.permisos is not None:
        # Delete old
        for rp in list(rol.rol_permisos):
            await session.delete(rp)
        # Add new
        for p_id in rol_in.permisos:
            new_rp = RolPermiso(rol_id=rol.id, permiso_id=p_id)
            session.add(new_rp)

    session.add(rol)
    await session.commit()

    # Reload again to get updated relationships safely
    result = await session.execute(
        select(Rol)
        .options(
            selectinload(Rol.area), selectinload(Rol.empleados), selectinload(Rol.rol_permisos)
        )
        .where(Rol.id == rol_id)
    )
    rol = result.scalar_one()

    resp = RolResponse.model_validate(rol)
    resp.area_nombre = str(rol.area.nombre_area) if rol.area else None
    resp.empleados_count = len(rol.empleados) if rol.empleados else 0
    resp.permisos = [rp.permiso_id for rp in rol.rol_permisos]
    return resp


@router.delete("/{rol_id}")
async def delete_rol(
    rol_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(
        select(Rol).options(selectinload(Rol.empleados)).where(Rol.id == rol_id)
    )
    rol = result.scalar_one_or_none()

    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    if rol.empleados and len(rol.empleados) > 0:
        emp_count = len(rol.empleados)
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar. Tiene {emp_count} empleados asignados.",
        )

    if rol.es_sistema:
        raise HTTPException(status_code=400, detail="No se pueden eliminar roles de sistema.")

    await session.delete(rol)
    await session.commit()
    return {"message": "Rol eliminado exitosamente"}


@router.post("/asignar")
async def asignar_rol(
    req: AsignarRolRequest,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Validate rol
    result_rol = await session.execute(select(Rol).where(Rol.id == req.rol_id))
    rol = result_rol.scalar_one_or_none()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    # Validate empleado
    result_emp = await session.execute(select(Empleado).where(Empleado.id == req.empleado_id))
    empleado = result_emp.scalar_one_or_none()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    empleado.rol_id = rol.id
    session.add(empleado)
    await session.commit()

    return {"message": f"Rol {rol.nombre_rol} asignado exitosamente a {empleado.nombre_completo}"}


@router.get("/empleado/{empleado_id}/permisos")
async def get_empleado_permisos(
    empleado_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(Empleado).where(Empleado.id == empleado_id))
    empleado = result.scalar_one_or_none()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Extraer excepciones del empleado
    query = select(EmpleadoPermiso).where(EmpleadoPermiso.empleado_id == empleado_id)
    result_excep = await session.execute(query)
    excepciones = result_excep.scalars().all()

    # Formato devuelto: { "concedidos": [id1, id2], "revocados": [id3, id4] }
    concedidos = [int(str(e.permiso_id)) for e in excepciones if e.concedido]
    revocados = [int(str(e.permiso_id)) for e in excepciones if not e.concedido]

    # Extraer permisos heredados por rol
    heredados: list[int] = []
    if empleado.rol_id:
        result_rol = await session.execute(
            select(RolPermiso).where(RolPermiso.rol_id == empleado.rol_id)
        )
        heredados = [int(str(rp.permiso_id)) for rp in result_rol.scalars().all()]

    return {
        "rol_id": empleado.rol_id,
        "heredados": heredados,
        "concedidos": concedidos,
        "revocados": revocados,
    }


@router.put("/empleado/{empleado_id}/permisos")
async def update_empleado_permisos(
    empleado_id: int,
    payload: EmpleadoPermisoUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(select(Empleado).where(Empleado.id == empleado_id))
    empleado = result.scalar_one_or_none()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Borrar permisos especiales actuales
    query = select(EmpleadoPermiso).where(EmpleadoPermiso.empleado_id == empleado_id)
    result_ep = await session.execute(query)
    for ep in result_ep.scalars().all():
        await session.delete(ep)

    # Añadir los nuevos
    for p_id, concedido in payload.permisos.items():
        new_ep = EmpleadoPermiso(empleado_id=empleado_id, permiso_id=p_id, concedido=concedido)
        session.add(new_ep)

    await session.commit()
    return {"message": "Permisos especiales actualizados"}
