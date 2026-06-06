from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db
from app.models.empleados import Empleado


async def get_token_from_cookie(request: Request) -> str:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
        )
    return token


async def get_current_user(
    session: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str, Depends(get_token_from_cookie)],
) -> Empleado:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        raw_sub = payload.get("sub")
        if raw_sub is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        empleado_id: str = str(raw_sub)
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado"
        )

    result = await session.execute(select(Empleado).where(Empleado.id == int(empleado_id)))
    empleado = result.scalar_one_or_none()

    if not empleado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if empleado.estatus != "Activo":
        raise HTTPException(status_code=400, detail="Usuario inactivo")

    return empleado


class RequirePermission:
    """
    Dependencia de FastAPI para proteger rutas basadas en permisos.
    Verifica primero los permisos concedidos al empleado y luego los de su rol,
    tomando en cuenta las revocaciones explícitas.
    """

    def __init__(self, permiso_slug: str):
        self.permiso_slug = permiso_slug

    async def __call__(
        self,
        session: Annotated[AsyncSession, Depends(get_db)],
        current_user: Annotated[Empleado, Depends(get_current_user)],
    ) -> Empleado:
        from app.models.seguridad import EmpleadoPermiso, Permiso, RolPermiso

        # 1. Obtener ID del permiso buscado
        result = await session.execute(select(Permiso).where(Permiso.slug == self.permiso_slug))
        permiso = result.scalar_one_or_none()

        if not permiso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"El permiso '{self.permiso_slug}' no existe en el sistema.",
            )

        # 2. Verificar excepciones del empleado (EmpleadoPermiso)
        result_ep = await session.execute(
            select(EmpleadoPermiso).where(
                EmpleadoPermiso.empleado_id == current_user.id,
                EmpleadoPermiso.permiso_id == permiso.id,
            )
        )
        empleado_permiso = result_ep.scalar_one_or_none()

        if empleado_permiso:
            if empleado_permiso.concedido:
                return current_user  # Permiso concedido explícitamente al usuario
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes permiso para realizar esta acción (revocado).",
                )

        # 3. Si no hay excepción, verificar el Rol del empleado
        if not current_user.rol_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción (sin rol asignado).",
            )

        result_rp = await session.execute(
            select(RolPermiso).where(
                RolPermiso.rol_id == current_user.rol_id, RolPermiso.permiso_id == permiso.id
            )
        )
        rol_permiso = result_rp.scalar_one_or_none()

        if not rol_permiso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción.",
            )

        return current_user
