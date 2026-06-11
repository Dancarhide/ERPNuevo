from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.websockets.connection_manager import manager
from app.models.comunicacion import Notificacion
from app.models.empleados import Empleado


async def crear_notificacion(
    session: AsyncSession,
    empleado_id: int,
    titulo: str,
    mensaje: str,
    tipo: str = "general",
    link: str = None,
) -> Notificacion:
    """
    Crea una notificación en base de datos y la envía por WebSocket.
    """
    nueva_notificacion = Notificacion(
        empleado_id=empleado_id,
        titulo=titulo,
        mensaje=mensaje,
        tipo=tipo,
        link=link,
        leida=False,
    )
    session.add(nueva_notificacion)
    await session.flush()  # Para obtener el ID si se necesita en el frontend
    await session.commit()
    await session.refresh(nueva_notificacion)

    # Convertir a dict para enviar por WS (igual al esquema NotificacionResponse)
    payload = {
        "id": nueva_notificacion.id,
        "empleado_id": nueva_notificacion.empleado_id,
        "titulo": nueva_notificacion.titulo,
        "mensaje": nueva_notificacion.mensaje,
        "tipo": nueva_notificacion.tipo,
        "leida": nueva_notificacion.leida,
        "link": nueva_notificacion.link,
        "creado_en": nueva_notificacion.creado_en.isoformat()
        if nueva_notificacion.creado_en
        else None,
    }

    # Enviar al usuario específico si está conectado
    await manager.send_personal_message({"type": "notification", "payload": payload}, empleado_id)

    return nueva_notificacion


async def crear_notificacion_masiva(
    session: AsyncSession,
    titulo: str,
    mensaje: str,
    tipo: str = "general",
    link: str = None,
):
    """
    Crea notificaciones para todos los empleados activos y las envía por WS.
    """
    # Obtener todos los empleados
    result = await session.execute(select(Empleado).where(Empleado.is_active))
    empleados = result.scalars().all()

    notificaciones = []
    for emp in empleados:
        n = Notificacion(
            empleado_id=emp.id,
            titulo=titulo,
            mensaje=mensaje,
            tipo=tipo,
            link=link,
            leida=False,
        )
        notificaciones.append(n)

    if notificaciones:
        session.add_all(notificaciones)
        await session.commit()

        # Enviar WS a todos los conectados
        # Es más eficiente simplemente usar manager.broadcast() si todos reciben lo mismo
        # Pero los IDs de notificación serán distintos.
        # Para el broadcast de UI, podemos enviar sin ID y que el frontend solo muestre el snackbar,
        # o iterar y enviar los IDs reales. Vamos a iterar.

        for n in notificaciones:
            await session.refresh(n)
            payload = {
                "id": n.id,
                "empleado_id": n.empleado_id,
                "titulo": n.titulo,
                "mensaje": n.mensaje,
                "tipo": n.tipo,
                "leida": n.leida,
                "link": n.link,
                "creado_en": n.creado_en.isoformat() if n.creado_en else None,
            }
            await manager.send_personal_message(
                {"type": "notification", "payload": payload}, n.empleado_id
            )
