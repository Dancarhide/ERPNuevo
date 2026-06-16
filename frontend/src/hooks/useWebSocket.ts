import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';

type WebSocketMessage = {
  type: string;
  payload: unknown;
};

let wsInstance: WebSocket | null = null;
let isConnecting = false;
let connected = false;
const listeners = new Set<(msg: WebSocketMessage) => void>();
const connectionListeners = new Set<(status: boolean) => void>();

const connectWs = async () => {
  if (wsInstance || isConnecting) return;
  isConnecting = true;
  try {
    let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let backendHost =
      window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      try {
        const parsedUrl = new URL(apiUrl);
        backendHost = parsedUrl.host;
        protocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      } catch {
        // Ignorar si no es una URL válida
      }
    }

    const wsUrl = `${protocol}//${backendHost}/api/notificaciones/ws`;

    const tokenData = await authApi.getWsToken();
    const finalWsUrl = `${wsUrl}?token=${tokenData.access_token}`;

    const ws = new WebSocket(finalWsUrl);

    ws.onopen = () => {
      connected = true;
      isConnecting = false;
      wsInstance = ws;
      connectionListeners.forEach((l) => l(true));
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      connected = false;
      isConnecting = false;
      wsInstance = null;
      connectionListeners.forEach((l) => l(false));
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(connectWs, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        listeners.forEach((l) => l(message));
      } catch (error) {
        console.error('Error parsing WebSocket message', error);
      }
    };
  } catch (err) {
    console.log('Error obtaining WS token, retrying...', err);
    isConnecting = false;
    setTimeout(connectWs, 5000);
  }
};

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(connected);

  useEffect(() => {
    connectWs();
    const connListener = (status: boolean) => setIsConnected(status);
    connectionListeners.add(connListener);

    return () => {
      connectionListeners.delete(connListener);
    };
  }, []);

  const subscribe = (callback: (msg: WebSocketMessage) => void) => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  };

  return { isConnected, subscribe };
}
