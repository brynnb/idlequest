import express from "express";
import CharacterService from "../services/CharacterService.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Get character by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const character = await CharacterService.getCharacterById(id);

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    return res.status(200).json(character);
  } catch (error) {
    logger.error("Error getting character:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get character by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const character = await CharacterService.getCharacterByUserId(userId);

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    return res.status(200).json(character);
  } catch (error) {
    logger.error("Error getting character by user ID:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new character
router.post("/", async (req, res) => {
  try {
    const characterData = req.body;
    const character = await CharacterService.createCharacter(characterData);

    return res.status(201).json(character);
  } catch (error) {
    logger.error("Error creating character:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update a character
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const characterData = req.body;
    const character = await CharacterService.updateCharacter(id, characterData);

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    return res.status(200).json(character);
  } catch (error) {
    logger.error("Error updating character:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a character
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await CharacterService.deleteCharacter(id);

    if (!success) {
      return res.status(404).json({ error: "Character not found" });
    }

    return res.status(200).json({ message: "Character deleted successfully" });
  } catch (error) {
    logger.error("Error deleting character:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get item by ID
router.get("/item/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await CharacterService.getItemById(id);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.status(200).json(item);
  } catch (error) {
    logger.error("Error getting item:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
