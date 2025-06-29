import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const useSocket = (url, opts) => {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const { auth, autoConnect = true, onConnect, onDisconnect } = opts || {};

    if (auth) {
      if (!socketRef.current) {
        const socket = io(url, {
          auth,
          autoConnect: false,
          transports: ["websocket"], // avoid polling for faster connect
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          setConnected(true);
          onConnect?.(socket);
        });

        socket.on("disconnect", () => {
          setConnected(false);
          onDisconnect?.();
        });

        if (autoConnect) {
          socket.connect();
        }
      }
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current?.off();
      socketRef.current = null;
    };
  }, [url, opts]);

  return {
    socket: reconnecting ? null : socketRef.current,
    connected,
    reconnect: useCallback(() => {
      if (socketRef.current) {
        setConnected(false);
        setReconnecting(true);
        socketRef.current = socketRef.current.connect();
        socketRef.current.on("connect", () => {
          setConnected(true);
          setReconnecting(false);
          opts?.onConnect?.(socketRef.current);
        });
      }

      return socketRef.current;
    }, [opts]),
  };
};
