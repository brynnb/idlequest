import express from "express";
import ZoneService from "../services/ZoneService.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Get all zones
router.get("/", async (req, res) => {
  try {
    const zones = await ZoneService.getAllZones();
    res.json(zones);
  } catch (error) {
    logger.error("Error fetching all zones:", error);
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

// Get zone by ID
router.get("/:id", async (req, res) => {
  try {
    const zoneId = parseInt(req.params.id);
    if (isNaN(zoneId)) {
      return res.status(400).json({ error: "Invalid zone ID" });
    }

    const zone = await ZoneService.getZoneById(zoneId);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    res.json(zone);
  } catch (error) {
    logger.error(`Error fetching zone ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch zone" });
  }
});

// Get zone by short name
router.get("/name/:shortName", async (req, res) => {
  try {
    const zone = await ZoneService.getZoneByShortName(req.params.shortName);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    res.json(zone);
  } catch (error) {
    logger.error(`Error fetching zone ${req.params.shortName}:`, error);
    res.status(500).json({ error: "Failed to fetch zone" });
  }
});

// Get adjacent zones
router.get("/:id/adjacent", async (req, res) => {
  try {
    const zoneId = parseInt(req.params.id);
    if (isNaN(zoneId)) {
      return res.status(400).json({ error: "Invalid zone ID" });
    }

    const adjacentZones = await ZoneService.getAdjacentZones(zoneId);
    res.json(adjacentZones);
  } catch (error) {
    logger.error(`Error fetching adjacent zones for ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch adjacent zones" });
  }
});

// Get NPCs in a zone
router.get("/:shortName/npcs", async (req, res) => {
  try {
    const npcs = await ZoneService.getZoneNPCs(req.params.shortName);
    res.json(npcs);
  } catch (error) {
    logger.error(
      `Error fetching NPCs for zone ${req.params.shortName}:`,
      error
    );
    res.status(500).json({ error: "Failed to fetch zone NPCs" });
  }
});

export default router;
