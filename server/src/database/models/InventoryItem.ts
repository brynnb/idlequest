import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config.js";
import Character from "./Character.js";

// Define the InventoryItem attributes
interface InventoryItemAttributes {
  id: number;
  characterId: number;
  itemId: number;
  slotId: number;
  quantity: number;
  charges: number;
  attuned: boolean;
  customData: object;
}

// Define which attributes can be null when creating a new record
interface InventoryItemCreationAttributes
  extends Optional<InventoryItemAttributes, "id"> {}

// Define the InventoryItem model
class InventoryItem
  extends Model<InventoryItemAttributes, InventoryItemCreationAttributes>
  implements InventoryItemAttributes
{
  public id!: number;
  public characterId!: number;
  public itemId!: number;
  public slotId!: number;
  public quantity!: number;
  public charges!: number;
  public attuned!: boolean;
  public customData!: object;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InventoryItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    characterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Character,
        key: "id",
      },
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    slotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    charges: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    attuned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    customData: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: "inventory_items",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["characterId", "slotId"],
        name: "inventory_character_slot_unique",
      },
      {
        fields: ["characterId"],
        name: "inventory_character_index",
      },
    ],
  }
);

// Define the relationship
Character.hasMany(InventoryItem, {
  sourceKey: "id",
  foreignKey: "characterId",
  as: "inventory",
});

InventoryItem.belongsTo(Character, {
  foreignKey: "characterId",
  as: "character",
});

export default InventoryItem;
