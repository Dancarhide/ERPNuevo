from typing import Any, Dict, List

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Map of empleado_id -> List of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, empleado_id: int):
        await websocket.accept()
        if empleado_id not in self.active_connections:
            self.active_connections[empleado_id] = []
        self.active_connections[empleado_id].append(websocket)

    def disconnect(self, websocket: WebSocket, empleado_id: int):
        if empleado_id in self.active_connections:
            self.active_connections[empleado_id].remove(websocket)
            if not self.active_connections[empleado_id]:
                del self.active_connections[empleado_id]

    async def send_personal_message(self, message: dict[str, Any], empleado_id: int):
        """Sends a JSON message to a specific user (all their active connections)."""
        if empleado_id in self.active_connections:
            for connection in self.active_connections[empleado_id]:
                await connection.send_json(message)

    async def broadcast(self, message: dict[str, Any]):
        """Sends a JSON message to all connected users."""
        for connections in self.active_connections.values():
            for connection in connections:
                await connection.send_json(message)


manager = ConnectionManager()
