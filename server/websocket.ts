import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
}

const clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws"
  });

  wss.on("connection", (ws: AuthenticatedWebSocket, req) => {
    let userId: string | undefined;
    let userRole: string | undefined;

    // Extract token from query parameter
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
        userRole = decoded.role;
        ws.userId = userId;
        ws.userRole = userRole;

        // Add to clients map
        if (!clients.has(userId)) {
          clients.set(userId, new Set());
        }
        clients.get(userId)!.add(ws);

        console.log(`WebSocket connected: User ${userId} (${userRole})`);
      } catch (error) {
        console.error("Invalid WebSocket token:", error);
        ws.close(1008, "Invalid token");
        return;
      }
    } else {
      console.log("WebSocket connection without token");
      ws.close(1008, "Authentication required");
      return;
    }

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("WebSocket message received:", data);
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      if (userId && clients.has(userId)) {
        clients.get(userId)!.delete(ws);
        if (clients.get(userId)!.size === 0) {
          clients.delete(userId);
        }
      }
      console.log(`WebSocket disconnected: User ${userId}`);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Send initial connection success message
    ws.send(JSON.stringify({ type: "connected", message: "WebSocket connection established" }));
  });

  return wss;
}

export function broadcastToUser(userId: string, data: any) {
  const userSockets = clients.get(userId);
  if (userSockets) {
    const message = JSON.stringify(data);
    userSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

export function broadcastToAll(data: any) {
  const message = JSON.stringify(data);
  clients.forEach((userSockets) => {
    userSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  });
}
