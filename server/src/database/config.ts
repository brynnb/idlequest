import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Debug: Log environment variables
console.log("Database Environment Variables:");
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? "[SET]" : "[NOT SET]"}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_DIALECT: ${process.env.DB_DIALECT}`);

// Database configuration
const DB_NAME = process.env.DB_NAME || "idlequest";
const DB_USER = process.env.DB_USER || "user_name";
const DB_PASSWORD = process.env.DB_PASSWORD || "user_password";
const DB_HOST = process.env.DB_HOST || "0.0.0.0";
const DB_PORT = parseInt(process.env.DB_PORT || "3306");
const DB_DIALECT = process.env.DB_DIALECT || "mysql";

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT as any,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

export default sequelize;
