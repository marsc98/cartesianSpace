import { useEffect, useRef, useState } from "react";

export type WSMessageType = 'trace' | 'cursor' | 'join' | 'leave';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
}

const useBinaryWebSocket = (
  url: string, 
  socketId: string | null, 
  handlePencilDraw: (x: number, y: number, z: number) => void, 
  p0: { onConnect?: () => void; onDisconnect?: () => void; }
) => {
  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const lastDraw = useRef(0);

  useEffect(() => {
    if (socketId) {
      socket.current = new WebSocket(url);
      socket.current.binaryType = "arraybuffer";

      socket.current.onopen = () => {
        setIsConnected(true);
      };

      socket.current.onmessage = (event) => {
        const buffer = event.data;

        if (buffer.byteLength !== 16) return;

        const now = performance.now();
        if (now - lastDraw.current < 16) return;
        lastDraw.current = now;

        const view = new DataView(buffer);
        const sessionId = view.getInt32(0, true);
        const x = view.getInt32(4, true);
        const y = view.getInt32(8, true);
        const z = view.getInt32(12, true);

        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return;
        if (Math.abs(x) > 10000 || Math.abs(y) > 10000 || Math.abs(z) > 10000) return;

        handlePencilDraw(x, y, z);
      };

      socket.current.onclose = () => {
        setIsConnected(false);
      };

      return () => {
        socket.current.close();
      };
    }
  }, [url, socketId, handlePencilDraw]);

  const sendBinaryData = (sessionId: number, x: number, y: number, z: number) => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket não está conectado!");
      return;
    }

    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setInt32(0, sessionId, true);
    view.setInt32(4, x, true);
    view.setInt32(8, y, true);
    view.setInt32(12, z, true);

    socket.current.send(buffer);
  };

  const arrayBufferToFloatArray = (buffer: ArrayBuffer) => {
    const view = new DataView(buffer);
    return [
      view.getFloat32(0),
      view.getFloat32(4),
      view.getFloat32(8),
    ];
  };

  return { sendBinaryData, isConnected };
};

export default useBinaryWebSocket;

