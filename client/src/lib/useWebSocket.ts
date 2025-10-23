import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
}

export function useWebSocket() {
  const { isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const connect = () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log("WebSocket message:", message);

            if (message.type === "new_alert") {
              toast({
                title: "New Alert",
                description: message.data?.message || "You have a new alert",
                variant: "default",
              });
            } else if (message.type === "alert_resolved") {
              toast({
                title: "Alert Resolved",
                description: message.data?.message || "An alert has been resolved",
              });
            } else if (message.type === "connected") {
              console.log("WebSocket connection established");
            }
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);
          wsRef.current = null;

          // Attempt to reconnect with exponential backoff
          if (
            isAuthenticated &&
            reconnectAttemptsRef.current < maxReconnectAttempts
          ) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current++;
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, toast]);

  return { isConnected };
}
