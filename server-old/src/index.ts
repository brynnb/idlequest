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
import { initDatabase } from "./database/init.js";
import characterRoutes from "./routes/characterRoutes.js";
import zoneRoutes from "./routes/zoneRoutes.js";
import eqDataRoutes from "./routes/eqDataRoutes.js";
import dialogueRoutes from "./routes/dialogueRoutes.js";
import { execSync } from "child_process";

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

// API Routes
app.use("/api/characters", characterRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/eq", eqDataRoutes);
app.use("/api", dialogueRoutes);

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

// Initialize database and start server
const startServer = async () => {
  try {
    // Try to initialize database, but don't fail if it's not available
    try {
      await initDatabase();
      logger.info("Database initialized successfully");
    } catch (dbError) {
      logger.warn(
        "Database initialization failed, continuing without it:",
        dbError
      );
      logger.info("EQ data API will still work with SQLite database");
    }

    // Setup socket handlers
    setupSocketHandlers(io);

    // Start server with error handling for EADDRINUSE
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.error(
          `Port ${PORT} is already in use. Please close the other application or use a different port.`
        );
        logger.info("Attempting to find and kill the process...");

        try {
          // Try to find and kill the process using the port
          if (process.platform === "win32") {
            // Windows
            const findCommand = `netstat -ano | findstr :${PORT} | findstr LISTENING`;
            const output = execSync(findCommand, { encoding: "utf8" });
            const match = output.match(/LISTENING\s+(\d+)/);
            if (match && match[1]) {
              const pid = match[1];
              logger.info(
                `Found process with PID ${pid}. Attempting to kill it...`
              );
              execSync(`taskkill /F /PID ${pid}`);
              logger.info(
                `Process with PID ${pid} has been killed. Retrying server start...`
              );
              // Retry starting the server after a short delay
              setTimeout(() => server.listen(PORT), 1000);
            }
          } else {
            // Unix-like
            const findCommand = `lsof -i :${PORT} | grep LISTEN`;
            const output = execSync(findCommand, { encoding: "utf8" });
            const lines = output.split("\n").filter(Boolean);
            if (lines.length > 0) {
              const parts = lines[0].trim().split(/\s+/);
              const pid = parts[1];
              logger.info(
                `Found process with PID ${pid}. Attempting to kill it...`
              );
              execSync(`kill -9 ${pid}`);
              logger.info(
                `Process with PID ${pid} has been killed. Retrying server start...`
              );
              // Retry starting the server after a short delay
              setTimeout(() => server.listen(PORT), 1000);
            }
          }
        } catch (killError) {
          logger.error("Failed to kill the process:", killError);
          logger.error(
            "Please manually kill the process using the port and restart the server."
          );
          process.exit(1);
        }
      } else {
        logger.error("Server error:", error);
        process.exit(1);
      }
    });

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`WebSocket server accepting connections from ${CLIENT_URL}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

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
