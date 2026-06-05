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
