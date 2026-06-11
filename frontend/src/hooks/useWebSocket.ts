import { useEffect, useRef, useState } from 'react';
import { authApi } from '@/lib/api';

type WebSocketMessage = {
  type: string;
  payload: unknown;
};

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Definir la URL basada en el origin actual
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Asumiendo que el backend corre bajo /api
    const backendHost =
      window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${backendHost}/api/notificaciones/ws`;

    const connect = async () => {
      try {
        // Fetch token first to pass it in query string because WS doesn't send cookies cross-origin
        const tokenData = await authApi.getWsToken();
        const finalWsUrl = `${wsUrl}?token=${tokenData.access_token}`;

        ws.current = new WebSocket(finalWsUrl);

        ws.current.onopen = () => {
          setIsConnected(true);
          console.log('WebSocket connected');
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected, reconnecting...');
          // Intentar reconectar
          setTimeout(connect, 3000);
        };

        ws.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setLastMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message', error);
          }
        };
      } catch (err) {
        console.log('Error obtaining WS token, retrying...', err);
        setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (ws.current) {
        // Evitar reconexiones si se desmonta
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, []);

  return { isConnected, lastMessage };
}
