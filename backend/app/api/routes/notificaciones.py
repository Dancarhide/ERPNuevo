from typing import Annotated, Any, List

import jwt
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.api.websockets.connection_manager import manager
from app.core.config import settings
from app.core.database import get_db
from app.models.comunicacion import Notificacion
from app.models.empleados import Empleado
from app.schemas.notificaciones import NotificacionResponse

router = APIRouter()


@router.get("", response_model=List[NotificacionResponse])
async def get_mis_notificaciones(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    query = (
        select(Notificacion)
        .where(Notificacion.empleado_id == current_user.id)
        .order_by(Notificacion.creado_en.desc())
        .limit(50)
    )
    result = await session.execute(query)
    notificaciones = result.scalars().all()
    return notificaciones


@router.put("/{notificacion_id}/leida")
async def marcar_como_leida(
    notificacion_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    query = select(Notificacion).where(
        Notificacion.id == notificacion_id, Notificacion.empleado_id == current_user.id
    )
    result = await session.execute(query)
    notificacion = result.scalar_one_or_none()

    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    notificacion.leida = True
    session.add(notificacion)
    await session.commit()
    return {"message": "Notificación marcada como leída"}


@router.put("/leidas")
async def marcar_todas_leidas(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    query = select(Notificacion).where(
        Notificacion.empleado_id == current_user.id, Notificacion.leida.is_(False)
    )
    result = await session.execute(query)
    notificaciones = result.scalars().all()

    for n in notificaciones:
        n.leida = True
        session.add(n)

    await session.commit()
    return {"message": "Todas las notificaciones marcadas como leídas"}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, session: AsyncSession = Depends(get_db)):
    token = websocket.cookies.get("access_token") or websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        empleado_id = int(payload.get("sub"))
    except Exception:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, empleado_id)
    try:
        while True:
            # Mantener conexión viva y recibir posibles mensajes del cliente si es necesario
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, empleado_id)
