from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import generate_random_password, get_password_hash
from app.models.empleados import Empleado, EmpleadoFamiliar, EmpleadoSalud
from app.models.seguridad import Credencial
from app.schemas.empleados import (
    EmpleadoCreate,
    EmpleadoResponse,
    EmpleadosListResponse,
    EmpleadoUpdate,
)

router = APIRouter()


@router.get("", response_model=EmpleadosListResponse)
async def read_empleados(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query(None, description="Búsqueda por nombre o correo"),
    estatus: str = Query(None, description="Filtro por estatus"),
) -> Any:
    query = select(Empleado).options(
        selectinload(Empleado.familiares), selectinload(Empleado.datos_salud)
    )

    if search:
        query = query.where(
            (Empleado.nombre_completo.ilike(f"%{search}%")) | (Empleado.email.ilike(f"%{search}%"))
        )

    if estatus:
        query = query.where(Empleado.estatus == estatus)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    # Paginate
    query = query.offset((page - 1) * size).limit(size)
    result = await session.execute(query)
    empleados = result.scalars().all()

    return {"items": empleados, "total": total, "page": page, "size": size}


@router.post("", response_model=EmpleadoResponse, status_code=status.HTTP_201_CREATED)
async def create_empleado(
    empleado_in: EmpleadoCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Check if email exists
    if empleado_in.email:
        result = await session.execute(select(Empleado).where(Empleado.email == empleado_in.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="El correo ya está registrado")

    empleado_data = empleado_in.model_dump(exclude={"familiares", "datos_salud"})
    nuevo_empleado = Empleado(**empleado_data)

    session.add(nuevo_empleado)
    await session.flush()  # Para obtener el ID

    # Crear credencial / usuario
    password_temporal = generate_random_password()
    hashed_password = get_password_hash(password_temporal)

    # Nombre de usuario: email si tiene, si no "user_{id}"
    username = str(empleado_in.email) if empleado_in.email else f"user_{nuevo_empleado.id}"

    credencial = Credencial(
        empleado_id=nuevo_empleado.id,
        nombre_usuario=username,
        contrasena_hasheada=hashed_password,
        requiere_cambio_contrasena=True,
    )
    session.add(credencial)

    if empleado_in.familiares:
        for fam in empleado_in.familiares:
            nuevo_fam = EmpleadoFamiliar(**fam.model_dump(), empleado_id=nuevo_empleado.id)
            session.add(nuevo_fam)

    if empleado_in.datos_salud:
        salud = EmpleadoSalud(**empleado_in.datos_salud.model_dump(), empleado_id=nuevo_empleado.id)
        session.add(salud)

    await session.commit()
    await session.refresh(nuevo_empleado)

    # Inyectar password temporal para que lo vea el Frontend
    setattr(nuevo_empleado, "password_temporal", password_temporal)

    return nuevo_empleado


@router.get("/{empleado_id}", response_model=EmpleadoResponse)
async def read_empleado(
    empleado_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(
        select(Empleado)
        .options(selectinload(Empleado.familiares), selectinload(Empleado.datos_salud))
        .where(Empleado.id == empleado_id)
    )
    empleado = result.scalar_one_or_none()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado


@router.put("/{empleado_id}", response_model=EmpleadoResponse)
async def update_empleado(
    empleado_id: int,
    empleado_in: EmpleadoUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    result = await session.execute(
        select(Empleado)
        .options(selectinload(Empleado.familiares), selectinload(Empleado.datos_salud))
        .where(Empleado.id == empleado_id)
    )
    empleado = result.scalar_one_or_none()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    update_data = empleado_in.model_dump(exclude={"familiares", "datos_salud"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(empleado, key, value)

    # Actualizar o recrear familiares
    if empleado_in.familiares is not None:
        # Simplificación: borrar y recrear
        await session.execute(
            select(EmpleadoFamiliar).where(EmpleadoFamiliar.empleado_id == empleado_id)
        )
        for fam in empleado.familiares:
            await session.delete(fam)

        for fam_data in empleado_in.familiares:
            nuevo_fam = EmpleadoFamiliar(**fam_data.model_dump(), empleado_id=empleado.id)
            session.add(nuevo_fam)

    # Actualizar o crear salud
    if empleado_in.datos_salud is not None:
        if empleado.datos_salud:
            for key, value in empleado_in.datos_salud.model_dump().items():
                setattr(empleado.datos_salud, key, value)
        else:
            salud = EmpleadoSalud(**empleado_in.datos_salud.model_dump(), empleado_id=empleado.id)
            session.add(salud)

    await session.commit()
    await session.refresh(empleado)
    return empleado


@router.post("/{empleado_id}/reset-password")
async def reset_password(
    empleado_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> dict[str, str]:
    result = await session.execute(select(Credencial).where(Credencial.empleado_id == empleado_id))
    credencial = result.scalar_one_or_none()

    if not credencial:
        # Podría no tener credencial aún. Se crea.
        emp_result = await session.execute(select(Empleado).where(Empleado.id == empleado_id))
        empleado = emp_result.scalar_one_or_none()
        if not empleado:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")

        username = str(empleado.email) if empleado.email else f"user_{empleado.id}"
        credencial = Credencial(
            empleado_id=empleado.id, nombre_usuario=username, requiere_cambio_contrasena=True
        )
        session.add(credencial)

    password_temporal = generate_random_password()
    credencial.contrasena_hasheada = get_password_hash(password_temporal)  # type: ignore[assignment]
    credencial.requiere_cambio_contrasena = True  # type: ignore[assignment]

    await session.commit()
    return {"password_temporal": password_temporal}
