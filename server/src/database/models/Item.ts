import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config.js";

// Define the Item attributes
interface ItemAttributes {
  id: number;
  name: string;
  description: string;
  itemclass: string;
  icon: string;
  slots: number;
  price: number;
  weight: number;
  bagslots: number;
  attributes: object;
  stats: object;
  resistances: object;
  effects: object;
  requiredLevel: number;
  requiredClass: string;
  requiredRace: string;
}

// Define which attributes can be null when creating a new record
interface ItemCreationAttributes extends Optional<ItemAttributes, "id"> {}

// Define the Item model
class Item
  extends Model<ItemAttributes, ItemCreationAttributes>
  implements ItemAttributes
{
  public id!: number;
  public name!: string;
  public description!: string;
  public itemclass!: string;
  public icon!: string;
  public slots!: number;
  public price!: number;
  public weight!: number;
  public bagslots!: number;
  public attributes!: object;
  public stats!: object;
  public resistances!: object;
  public effects!: object;
  public requiredLevel!: number;
  public requiredClass!: string;
  public requiredRace!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Item.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    itemclass: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    bagslots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    attributes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    stats: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    resistances: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    effects: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    requiredLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    requiredClass: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requiredRace: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "items",
    timestamps: true,
  }
);

export default Item;
