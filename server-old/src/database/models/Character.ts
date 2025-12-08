import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config.js";

// Define the Character attributes
interface CharacterAttributes {
  id: number;
  userId: string;
  name: string;
  level: number;
  exp: number;
  maxHp: number;
  curHp: number;
  maxMana: number;
  curMana: number;
  zoneId: number;
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
  weight: number;
  weightAllowance: number;
  // Store complex data as JSON
  attributes: object;
  totalAttributes: object;
  stats: object;
  // We'll store inventory in a separate table
  lastUpdated: Date;
}

// Define which attributes can be null when creating a new record
interface CharacterCreationAttributes
  extends Optional<CharacterAttributes, "id"> {}

// Define the Character model
class Character
  extends Model<CharacterAttributes, CharacterCreationAttributes>
  implements CharacterAttributes
{
  public id!: number;
  public userId!: string;
  public name!: string;
  public level!: number;
  public exp!: number;
  public maxHp!: number;
  public curHp!: number;
  public maxMana!: number;
  public curMana!: number;
  public zoneId!: number;
  public platinum!: number;
  public gold!: number;
  public silver!: number;
  public copper!: number;
  public weight!: number;
  public weightAllowance!: number;
  public attributes!: object;
  public totalAttributes!: object;
  public stats!: object;
  public lastUpdated!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Character.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    exp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    maxHp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    curHp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    maxMana: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    curMana: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    zoneId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    platinum: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    gold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    silver: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    copper: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    weightAllowance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    attributes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    totalAttributes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    stats: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "characters",
    timestamps: true,
  }
);

export default Character;
