import asyncio
import json
from typing import Any, Dict, List

from fastapi import WebSocket

from app.core.redis import redis_client


class ConnectionManager:
    def __init__(self):
        # Map of empleado_id -> List of active WebSocket connections locally
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.pubsub_task = None

    async def connect(self, websocket: WebSocket, empleado_id: int):
        await websocket.accept()
        if empleado_id not in self.active_connections:
            self.active_connections[empleado_id] = []
        self.active_connections[empleado_id].append(websocket)

        # Iniciar listener de Redis si no está corriendo
        if self.pubsub_task is None and redis_client.client is not None:
            self.pubsub_task = asyncio.create_task(self._listen_to_redis())

    def disconnect(self, websocket: WebSocket, empleado_id: int):
        if empleado_id in self.active_connections:
            if websocket in self.active_connections[empleado_id]:
                self.active_connections[empleado_id].remove(websocket)
            if not self.active_connections[empleado_id]:
                del self.active_connections[empleado_id]

    async def _listen_to_redis(self):
        if not redis_client.client:
            return
        pubsub = redis_client.client.pubsub()
        await pubsub.subscribe("ws_messages")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    target_id = data.get("empleado_id")
                    payload = data.get("payload")
                    if target_id == "all":
                        await self._local_broadcast(payload)
                    elif target_id is not None:
                        await self._local_send(payload, int(target_id))
        except Exception:
            pass

    async def _local_send(self, message: dict[str, Any], empleado_id: int):
        """Envía el mensaje solo a las conexiones locales de este proceso"""
        if empleado_id in self.active_connections:
            for connection in self.active_connections[empleado_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def _local_broadcast(self, message: dict[str, Any]):
        """Envía el mensaje a todas las conexiones locales de este proceso"""
        for connections in self.active_connections.values():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def send_personal_message(self, message: dict[str, Any], empleado_id: int):
        """Publica el mensaje en Redis para que llegue al usuario,
        sin importar en qué servidor esté"""
        if redis_client.client:
            data = {"empleado_id": empleado_id, "payload": message}
            await redis_client.client.publish("ws_messages", json.dumps(data, default=str))
        else:
            await self._local_send(message, empleado_id)

    async def broadcast(self, message: dict[str, Any]):
        """Publica el mensaje en Redis para todos los usuarios"""
        if redis_client.client:
            data = {"empleado_id": "all", "payload": message}
            await redis_client.client.publish("ws_messages", json.dumps(data, default=str))
        else:
            await self._local_broadcast(message)


manager = ConnectionManager()
