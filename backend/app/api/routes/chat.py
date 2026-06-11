from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.api.websockets.connection_manager import manager
from app.core.database import get_db
from app.models.comunicacion import Conversacion, ConversacionParticipante, Mensaje
from app.models.empleados import Empleado
from app.schemas.chat import MensajeCreate, MensajeResponse

router = APIRouter()


async def get_or_create_private_conversation(
    session: AsyncSession, emp1_id: int, emp2_id: int
) -> Conversacion:
    # Buscar si ya existe una conversación privada entre estos dos
    # Esto es un query complejo, pero simplificado:
    # Buscamos conversaciones que tengan exactamente a emp1 y emp2

    # Todos los IDs de conversaciones donde emp1 participa
    q1 = select(ConversacionParticipante.conversacion_id).where(
        ConversacionParticipante.empleado_id == emp1_id
    )
    res1 = await session.execute(q1)
    conv_ids_1 = [r for r in res1.scalars()]

    if conv_ids_1:
        # De esas, ¿en cuáles participa emp2 y son privadas?
        q2 = (
            select(Conversacion)
            .join(ConversacionParticipante)
            .where(
                Conversacion.id.in_(conv_ids_1),
                Conversacion.tipo == "privada",
                ConversacionParticipante.empleado_id == emp2_id,
            )
        )
        res2 = await session.execute(q2)
        conv = res2.scalar_one_or_none()
        if conv:
            return conv

    # Si no existe, crearla
    nueva_conv = Conversacion(tipo="privada")
    session.add(nueva_conv)
    await session.flush()

    p1 = ConversacionParticipante(conversacion_id=nueva_conv.id, empleado_id=emp1_id)
    p2 = ConversacionParticipante(conversacion_id=nueva_conv.id, empleado_id=emp2_id)
    session.add_all([p1, p2])
    await session.flush()
    return nueva_conv


@router.get("/conversacion/{destinatario_id}", response_model=List[MensajeResponse])
async def get_mensajes_conversacion(
    destinatario_id: int,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # 1. Obtener o crear conversacion
    conv = await get_or_create_private_conversation(session, current_user.id, destinatario_id)

    # 2. Marcar como leídos los mensajes que mandó el otro
    q_unread = select(Mensaje).where(
        Mensaje.conversacion_id == conv.id,
        Mensaje.emisor_id == destinatario_id,
        Mensaje.leido.is_(False),
    )
    unreads = await session.execute(q_unread)
    for m in unreads.scalars():
        m.leido = True
        session.add(m)
    await session.commit()
    # 3. Retornar historial (últimos 50 mensajes por simplicidad)
    query = (
        select(Mensaje)
        .where(Mensaje.conversacion_id == conv.id)
        .options(selectinload(Mensaje.emisor))
        .order_by(Mensaje.creado_en.asc())
        .limit(50)
    )
    result = await session.execute(query)
    mensajes = result.scalars().all()

    return mensajes


@router.post("", response_model=MensajeResponse)
async def send_mensaje(
    mensaje_in: MensajeCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Empleado, Depends(get_current_user)],
) -> Any:
    # Verificar destinatario
    dest_res = await session.execute(
        select(Empleado).where(Empleado.id == mensaje_in.destinatario_id)
    )
    destinatario = dest_res.scalar_one_or_none()
    if not destinatario:
        raise HTTPException(status_code=404, detail="Destinatario no encontrado")

    conv = await get_or_create_private_conversation(
        session, current_user.id, mensaje_in.destinatario_id
    )

    nuevo_mensaje = Mensaje(
        conversacion_id=conv.id, emisor_id=current_user.id, contenido=mensaje_in.contenido
    )
    session.add(nuevo_mensaje)
    await session.commit()

    # Recargar el mensaje con el emisor cargado
    query_msg = (
        select(Mensaje).where(Mensaje.id == nuevo_mensaje.id).options(selectinload(Mensaje.emisor))
    )
    res_msg = await session.execute(query_msg)
    nuevo_mensaje = res_msg.scalar_one()

    # Enviar por WebSocket al destinatario
    await manager.send_personal_message(
        {
            "type": "chat",
            "payload": {
                "id": nuevo_mensaje.id,
                "conversacion_id": nuevo_mensaje.conversacion_id,
                "emisor_id": nuevo_mensaje.emisor_id,
                "emisor_nombre": current_user.nombre_completo,
                "contenido": nuevo_mensaje.contenido,
                "creado_en": str(nuevo_mensaje.creado_en),
                "leido": False,
            },
        },
        mensaje_in.destinatario_id,
    )

    return nuevo_mensaje
