from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.empleados import Empleado
from app.models.seguridad import Credencial
from app.schemas.auth import ChangePasswordRequest, LoginRequest, LoginResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest, response: Response, session: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    # Buscar empleado
    result = await session.execute(select(Empleado).where(Empleado.email == request.email))
    empleado = result.scalar_one_or_none()

    if not empleado or not empleado.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

    # Buscar credencial
    cred_result = await session.execute(
        select(Credencial).where(Credencial.empleado_id == empleado.id)
    )
    credencial = cred_result.scalar_one_or_none()

    if not credencial or not verify_password(request.password, str(credencial.contrasena_hasheada)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

    # Generar Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=empleado.id, expires_delta=access_token_expires)

    # Crear Cookie HTTP-Only y Secure
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # PONER EN TRUE EN PRODUCCION SI HAY HTTPS
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    # Calcular permisos
    permisos_slugs = set()
    if empleado.rol_id:
        from app.models.seguridad import Permiso, RolPermiso

        result_rol_perm = await session.execute(
            select(Permiso.slug).join(RolPermiso).where(RolPermiso.rol_id == empleado.rol_id)
        )
        for slug in result_rol_perm.scalars().all():
            permisos_slugs.add(slug)

    # Excepciones
    from app.models.seguridad import EmpleadoPermiso, Permiso

    result_emp_perm = await session.execute(
        select(Permiso.slug, EmpleadoPermiso.concedido)
        .join(EmpleadoPermiso)
        .where(EmpleadoPermiso.empleado_id == empleado.id)
    )
    for slug, concedido in result_emp_perm.all():
        if concedido:
            permisos_slugs.add(slug)
        elif slug in permisos_slugs:
            permisos_slugs.remove(slug)

    return LoginResponse(
        id=int(empleado.id),
        nombre_completo=str(empleado.nombre_completo),
        email=str(empleado.email),
        rol=None,  # Todo: Cargar rol si es necesario para el frontend
        requiere_cambio_contrasena=bool(credencial.requiere_cambio_contrasena),
        permisos=list(permisos_slugs),
    )


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: Annotated[Empleado, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> Any:
    cred_result = await session.execute(
        select(Credencial).where(Credencial.empleado_id == current_user.id)
    )
    credencial = cred_result.scalar_one()

    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=400, detail="La contraseña debe tener al menos 6 caracteres"
        )

    credencial.contrasena_hasheada = get_password_hash(request.new_password)  # type: ignore[assignment]
    credencial.requiere_cambio_contrasena = False  # type: ignore[assignment]

    session.add(credencial)
    await session.commit()

    return {"message": "Contraseña actualizada exitosamente"}


@router.post("/logout")
async def logout(response: Response) -> Any:
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"message": "Sesión cerrada"}


@router.get("/me", response_model=LoginResponse)
async def read_users_me(
    current_user: Annotated[Empleado, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> Any:
    cred_result = await session.execute(
        select(Credencial).where(Credencial.empleado_id == current_user.id)
    )
    credencial = cred_result.scalar_one()

    # Calcular permisos
    permisos_slugs = set()
    if current_user.rol_id:
        from app.models.seguridad import Permiso, RolPermiso

        result_rol_perm = await session.execute(
            select(Permiso.slug).join(RolPermiso).where(RolPermiso.rol_id == current_user.rol_id)
        )
        for slug in result_rol_perm.scalars().all():
            permisos_slugs.add(slug)

    # Excepciones
    from app.models.seguridad import EmpleadoPermiso, Permiso

    result_emp_perm = await session.execute(
        select(Permiso.slug, EmpleadoPermiso.concedido)
        .join(EmpleadoPermiso)
        .where(EmpleadoPermiso.empleado_id == current_user.id)
    )
    for slug, concedido in result_emp_perm.all():
        if concedido:
            permisos_slugs.add(slug)
        elif slug in permisos_slugs:
            permisos_slugs.remove(slug)

    return LoginResponse(
        id=int(current_user.id),
        nombre_completo=str(current_user.nombre_completo),
        email=str(current_user.email),
        rol=None,
        requiere_cambio_contrasena=bool(credencial.requiere_cambio_contrasena),
        permisos=list(permisos_slugs),
    )
