import Character from "./Character.js";
import InventoryItem from "./InventoryItem.js";
import Item from "./Item.js";
import sequelize from "../config.js";

// Initialize all models
const models = {
  Character,
  InventoryItem,
  Item,
};

// Export models and sequelize instance
export { Character, InventoryItem, Item, sequelize };
export default models;
