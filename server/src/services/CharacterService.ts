import { Character, InventoryItem, Item } from "../database/models/index.js";
import { logger } from "../utils/logger.js";
import { Op } from "sequelize";

// Define the character service
class CharacterService {
  // Get a character by ID
  async getCharacterById(id: number): Promise<any> {
    try {
      const character = await Character.findByPk(id, {
        include: [
          {
            model: InventoryItem,
            as: "inventory",
          },
        ],
      });

      if (!character) {
        return null;
      }

      // Format the character data to match the client-side structure
      const formattedCharacter = character.toJSON();

      // Get item details for inventory items
      if (
        formattedCharacter.inventory &&
        formattedCharacter.inventory.length > 0
      ) {
        const itemIds = formattedCharacter.inventory.map(
          (item: any) => item.itemId
        );
        const items = await Item.findAll({
          where: {
            id: {
              [Op.in]: itemIds,
            },
          },
        });

        // Add item details to inventory items
        formattedCharacter.inventory = formattedCharacter.inventory.map(
          (item: any) => {
            const itemDetails = items.find((i: any) => i.id === item.itemId);
            return {
              ...item,
              itemid: item.itemId,
              slotid: item.slotId,
              itemDetails: itemDetails ? itemDetails.toJSON() : null,
            };
          }
        );
      }

      return formattedCharacter;
    } catch (error) {
      logger.error("Error getting character by ID:", error);
      throw error;
    }
  }

  // Get a character by user ID
  async getCharacterByUserId(userId: string): Promise<any> {
    try {
      const character = await Character.findOne({
        where: { userId },
        include: [
          {
            model: InventoryItem,
            as: "inventory",
          },
        ],
      });

      if (!character) {
        return null;
      }

      // Format the character data to match the client-side structure
      const formattedCharacter = character.toJSON();

      // Get item details for inventory items
      if (
        formattedCharacter.inventory &&
        formattedCharacter.inventory.length > 0
      ) {
        const itemIds = formattedCharacter.inventory.map(
          (item: any) => item.itemId
        );
        const items = await Item.findAll({
          where: {
            id: {
              [Op.in]: itemIds,
            },
          },
        });

        // Add item details to inventory items
        formattedCharacter.inventory = formattedCharacter.inventory.map(
          (item: any) => {
            const itemDetails = items.find((i: any) => i.id === item.itemId);
            return {
              ...item,
              itemid: item.itemId,
              slotid: item.slotId,
              itemDetails: itemDetails ? itemDetails.toJSON() : null,
            };
          }
        );
      }

      return formattedCharacter;
    } catch (error) {
      logger.error("Error getting character by user ID:", error);
      throw error;
    }
  }

  // Create a new character
  async createCharacter(characterData: any): Promise<any> {
    try {
      // Extract inventory items from character data
      const { inventory, ...characterInfo } = characterData;

      // Create character
      const character = await Character.create(characterInfo);

      // Create inventory items if they exist
      if (inventory && inventory.length > 0) {
        const inventoryItems = inventory.map((item: any) => ({
          characterId: character.id,
          itemId: item.itemid,
          slotId: item.slotid,
          quantity: item.quantity || 1,
          charges: item.charges || 0,
          attuned: item.attuned || false,
          customData: item.customData || {},
        }));

        await InventoryItem.bulkCreate(inventoryItems);
      }

      // Return the created character with inventory
      return this.getCharacterById(character.id);
    } catch (error) {
      logger.error("Error creating character:", error);
      throw error;
    }
  }

  // Update a character
  async updateCharacter(id: number, characterData: any): Promise<any> {
    try {
      // Extract inventory items from character data
      const { inventory, ...characterInfo } = characterData;

      // Update character
      await Character.update(characterInfo, {
        where: { id },
      });

      // Update inventory items if they exist
      if (inventory && inventory.length > 0) {
        // Delete existing inventory items
        await InventoryItem.destroy({
          where: { characterId: id },
        });

        // Create new inventory items
        const inventoryItems = inventory.map((item: any) => ({
          characterId: id,
          itemId: item.itemid,
          slotId: item.slotid,
          quantity: item.quantity || 1,
          charges: item.charges || 0,
          attuned: item.attuned || false,
          customData: item.customData || {},
        }));

        await InventoryItem.bulkCreate(inventoryItems);
      }

      // Return the updated character with inventory
      return this.getCharacterById(id);
    } catch (error) {
      logger.error("Error updating character:", error);
      throw error;
    }
  }

  // Delete a character
  async deleteCharacter(id: number): Promise<boolean> {
    try {
      // Delete inventory items
      await InventoryItem.destroy({
        where: { characterId: id },
      });

      // Delete character
      const result = await Character.destroy({
        where: { id },
      });

      return result > 0;
    } catch (error) {
      logger.error("Error deleting character:", error);
      throw error;
    }
  }

  // Get an item by ID
  async getItemById(id: number): Promise<any> {
    try {
      const item = await Item.findByPk(id);
      return item ? item.toJSON() : null;
    } catch (error) {
      logger.error("Error getting item by ID:", error);
      throw error;
    }
  }
}

export default new CharacterService();
