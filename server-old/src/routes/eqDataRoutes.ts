import express from "express";
import {
  getItemById,
  getZoneById,
  getZoneByZoneId,
  getZoneNPCs,
  getNPCLoot,
  getAdjacentZones,
  getAllItems,
  getAllZones,
  initEQDatabase,
} from "../services/eqDatabaseService.js";

const router = express.Router();

// Initialize the EQ database on first request
router.use(async (req, res, next) => {
  try {
    await initEQDatabase();
    next();
  } catch (error) {
    console.error("Failed to initialize EQ database:", error);
    res.status(500).json({ error: "Database initialization failed" });
  }
});

// Get item by ID
router.get("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const item = await getItemById(id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// Get all items
router.get("/items", async (req, res) => {
  try {
    const items = await getAllItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Get zone by ID
router.get("/zones/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid zone ID" });
    }

    const zone = await getZoneById(id);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    res.json(zone);
  } catch (error) {
    console.error("Error fetching zone:", error);
    res.status(500).json({ error: "Failed to fetch zone" });
  }
});

// Get zone by zone ID number
router.get("/zones/by-zoneid/:zoneid", async (req, res) => {
  try {
    const zoneid = parseInt(req.params.zoneid);
    if (isNaN(zoneid)) {
      return res.status(400).json({ error: "Invalid zone ID number" });
    }

    const zone = await getZoneByZoneId(zoneid);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    res.json(zone);
  } catch (error) {
    console.error("Error fetching zone:", error);
    res.status(500).json({ error: "Failed to fetch zone" });
  }
});

// Get all zones
router.get("/zones", async (req, res) => {
  try {
    const zones = await getAllZones();
    res.json(zones);
  } catch (error) {
    console.error("Error fetching zones:", error);
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

// Get NPCs in a zone
router.get("/zones/:zoneName/npcs", async (req, res) => {
  try {
    const { zoneName } = req.params;
    const npcs = await getZoneNPCs(zoneName);
    res.json(npcs);
  } catch (error) {
    console.error("Error fetching zone NPCs:", error);
    res.status(500).json({ error: "Failed to fetch zone NPCs" });
  }
});

// Get NPC loot
router.get("/npcs/:npcId/loot", async (req, res) => {
  try {
    const npcId = parseInt(req.params.npcId);
    if (isNaN(npcId)) {
      return res.status(400).json({ error: "Invalid NPC ID" });
    }

    const loot = await getNPCLoot(npcId);
    res.json(loot);
  } catch (error) {
    console.error("Error fetching NPC loot:", error);
    res.status(500).json({ error: "Failed to fetch NPC loot" });
  }
});

// Get adjacent zones
router.get("/zones/:zoneId/adjacent", async (req, res) => {
  try {
    const zoneId = parseInt(req.params.zoneId);
    if (isNaN(zoneId)) {
      return res.status(400).json({ error: "Invalid zone ID" });
    }

    const adjacentZones = await getAdjacentZones(zoneId);
    res.json(adjacentZones);
  } catch (error) {
    console.error("Error fetching adjacent zones:", error);
    res.status(500).json({ error: "Failed to fetch adjacent zones" });
  }
});

export default router;
