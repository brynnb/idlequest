import { sequelize } from "./models/index.js";
import { logger } from "../utils/logger.js";

// Initialize database
export const initDatabase = async (): Promise<void> => {
  try {
    // Test connection
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");

    // Sync all models with database
    // Note: In production, you might want to use migrations instead of sync
    await sequelize.sync({ force: false, alter: false });
    logger.info("Database models synchronized successfully.");
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    throw error;
  }
};

export default initDatabase;
