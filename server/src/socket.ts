import { Server, Socket } from "socket.io";
import { logger } from "./utils/logger.js";
import { MessageType } from "./types/message.js";

// Track connected clients
const connectedClients = new Map<string, Socket>();

export const setupSocketHandlers = (io: Server): void => {
  // Middleware for authentication (can be expanded later)
  io.use((socket, next) => {
    // For now, just log the connection attempt
    logger.info(`Connection attempt from client: ${socket.id}`);
    next();
  });

  io.on("connection", (socket: Socket) => {
    const clientId = socket.id;

    // Store the client connection
    connectedClients.set(clientId, socket);

    logger.info(`Client connected: ${clientId}`);
    logger.info(`Total connected clients: ${connectedClients.size}`);

    // Send welcome message to the client
    socket.emit("chat-message", {
      id: Date.now(),
      text: "Connected to combat server!",
      timestamp: Date.now(),
      type: MessageType.SYSTEM,
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      // Remove client from connected clients
      connectedClients.delete(clientId);

      logger.info(`Client disconnected: ${clientId}, reason: ${reason}`);
      logger.info(`Total connected clients: ${connectedClients.size}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error(`Socket error for client ${clientId}:`, error);
    });
  });
};

// Utility function to broadcast a message to all connected clients
export const broadcastMessage = (message: any): void => {
  for (const socket of connectedClients.values()) {
    socket.emit("chat-message", message);
  }
};

// Utility function to send a message to a specific client
export const sendMessageToClient = (
  clientId: string,
  message: any
): boolean => {
  const socket = connectedClients.get(clientId);
  if (socket) {
    socket.emit("chat-message", message);
    return true;
  }
  return false;
};

// Get the number of connected clients
export const getConnectedClientsCount = (): number => {
  return connectedClients.size;
};
