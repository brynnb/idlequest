import { testConnection } from "../database/config.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  console.log("Testing database connection...");
  console.log("Database configuration:");
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Dialect: ${process.env.DB_DIALECT}`);

  const isConnected = await testConnection();

  if (isConnected) {
    console.log("Database connection successful!");
  } else {
    console.error("Database connection failed!");
    process.exit(1);
  }
}

testDatabaseConnection().catch((error) => {
  console.error("Error testing database connection:", error);
  process.exit(1);
});
