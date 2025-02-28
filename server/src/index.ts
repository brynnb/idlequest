import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { setupSocketHandlers } from "./socket.js";
import { logger } from "./utils/logger.js";
import {
  broadcastSystemAnnouncement,
  broadcastCombatEvent,
  broadcastLootEvent,
} from "./utils/broadcast.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6, // 1MB
});

// Setup socket handlers
setupSocketHandlers(io);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test broadcast endpoint
app.post("/api/broadcast", (req, res) => {
  const { message, type } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  broadcastSystemAnnouncement(message);
  logger.info(`Broadcast message: ${message}`);

  return res.status(200).json({ success: true });
});

// Test combat endpoint
app.post("/api/combat", (req, res) => {
  const { attacker, target, damage, isCritical } = req.body;

  if (!attacker || !target || damage === undefined) {
    return res
      .status(400)
      .json({ error: "Attacker, target, and damage are required" });
  }

  broadcastCombatEvent(attacker, target, damage, isCritical);
  logger.info(`Combat event: ${attacker} -> ${target} for ${damage} damage`);

  return res.status(200).json({ success: true });
});

// Test loot endpoint
app.post("/api/loot", (req, res) => {
  const { character, item, quantity } = req.body;

  if (!character || !item) {
    return res.status(400).json({ error: "Character and item are required" });
  }

  broadcastLootEvent(character, item, quantity || 1);
  logger.info(`Loot event: ${character} looted ${quantity || 1}x ${item}`);

  return res.status(200).json({ success: true });
});

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`WebSocket server accepting connections from ${CLIENT_URL}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

export { app, server, io };
