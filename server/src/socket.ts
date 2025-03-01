import { Server, Socket } from "socket.io";
import { logger } from "./utils/logger.js";
import { MessageType } from "./types/message.js";
import CharacterService from "./services/CharacterService.js";

// Track connected clients
const connectedClients = new Map<string, Socket>();
const clientCharacters = new Map<string, number>(); // Map of client ID to character ID

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

    // Handle character loading
    socket.on(
      "load-character",
      async (data: { characterId: number; userId: string }) => {
        try {
          let character;

          if (data.characterId) {
            // Load character by ID
            character = await CharacterService.getCharacterById(
              data.characterId
            );
          } else if (data.userId) {
            // Load character by user ID
            character = await CharacterService.getCharacterByUserId(
              data.userId
            );
          }

          if (character) {
            // Store the character ID for this client
            clientCharacters.set(clientId, character.id);

            // Send the character data to the client
            socket.emit("character-data", character);

            logger.info(
              `Character ${character.id} loaded for client ${clientId}`
            );
          } else {
            socket.emit("error", { message: "Character not found" });
            logger.warn(`Character not found for client ${clientId}`);
          }
        } catch (error) {
          logger.error(
            `Error loading character for client ${clientId}:`,
            error
          );
          socket.emit("error", { message: "Error loading character" });
        }
      }
    );

    // Handle character update
    socket.on("update-character", async (characterData: any) => {
      try {
        const characterId = clientCharacters.get(clientId);

        if (!characterId) {
          socket.emit("error", { message: "No character loaded" });
          return;
        }

        // Update the character
        const updatedCharacter = await CharacterService.updateCharacter(
          characterId,
          characterData
        );

        // Send the updated character data to the client
        socket.emit("character-data", updatedCharacter);

        logger.info(`Character ${characterId} updated for client ${clientId}`);
      } catch (error) {
        logger.error(`Error updating character for client ${clientId}:`, error);
        socket.emit("error", { message: "Error updating character" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      // Remove client from connected clients
      connectedClients.delete(clientId);
      clientCharacters.delete(clientId);

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
