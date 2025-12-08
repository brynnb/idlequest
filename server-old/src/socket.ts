import { Server, Socket } from "socket.io";
import { logger } from "./utils/logger.js";
import { MessageType } from "./types/message.js";
import CharacterService from "./services/CharacterService.js";
import ZoneService from "./services/ZoneService.js";

// Define Zone interface to fix type issues
interface Zone {
  id: number;
  zoneidnumber: number;
  short_name: string;
  long_name: string;
  [key: string]: any; // Allow other properties
}

// Track connected clients
const connectedClients = new Map<string, Socket>();
const clientCharacters = new Map<string, number>(); // Map of client ID to character ID
const clientZones = new Map<string, number>(); // Map of client ID to zone ID

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

            // Store the zone ID for this client
            if (character.zoneId) {
              clientZones.set(clientId, character.zoneId);

              // Join the zone room for zone-specific broadcasts
              socket.join(`zone:${character.zoneId}`);
            }

            // Send character data to the client
            socket.emit("character-loaded", character);
            logger.info(
              `Character loaded for client ${clientId}: ${character.name}`
            );
          } else {
            socket.emit("error", {
              message: "Character not found",
            });
            logger.warn(
              `Character not found for client ${clientId}: ${JSON.stringify(
                data
              )}`
            );
          }
        } catch (error) {
          logger.error("Error loading character:", error);
          socket.emit("error", {
            message: "Error loading character",
          });
        }
      }
    );

    // Handle zone change
    socket.on("change-zone", async (data: { zoneId: number }) => {
      try {
        const characterId = clientCharacters.get(clientId);
        if (!characterId) {
          socket.emit("error", {
            message: "No character loaded",
          });
          return;
        }

        const { zoneId } = data;

        // Get the zone data
        const zoneData = await ZoneService.getZoneById(zoneId);
        if (!zoneData) {
          socket.emit("error", {
            message: "Zone not found",
          });
          return;
        }

        // Cast to Zone type after null check
        const zone = zoneData as Zone;

        // Update character's zone in the database
        await CharacterService.updateCharacter(characterId, { zoneId });

        // Leave the old zone room if any
        const oldZoneId = clientZones.get(clientId);
        if (oldZoneId) {
          socket.leave(`zone:${oldZoneId}`);
        }

        // Join the new zone room
        socket.join(`zone:${zoneId}`);

        // Update the client's zone
        clientZones.set(clientId, zoneId);

        // Send zone data to the client
        socket.emit("zone-changed", {
          zone,
          message: `You have entered ${zone.long_name}`,
        });

        // Broadcast to other players in the zone
        socket.to(`zone:${zoneId}`).emit("player-entered-zone", {
          characterId,
          zoneName: zone.long_name,
        });

        logger.info(
          `Character ${characterId} changed zone to ${zone.long_name} (${zoneId})`
        );
      } catch (error) {
        logger.error("Error changing zone:", error);
        socket.emit("error", {
          message: "Error changing zone",
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // Remove client from tracking maps
      connectedClients.delete(clientId);
      clientCharacters.delete(clientId);

      // Leave zone room if in one
      const zoneId = clientZones.get(clientId);
      if (zoneId) {
        clientZones.delete(clientId);
      }

      logger.info(`Client disconnected: ${clientId}`);
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
