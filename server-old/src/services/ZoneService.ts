import { sequelize } from "../database/models/index.js";
import { logger } from "../utils/logger.js";
import { QueryTypes } from "sequelize";

/**
 * Service for handling zone-related operations
 * Uses direct database queries without caching for simplicity
 */
class ZoneService {
  /**
   * Get a zone by its ID
   */
  async getZoneById(zoneId: number) {
    try {
      const [zone] = await sequelize.query(
        `SELECT * FROM zone WHERE zoneidnumber = :zoneId`,
        {
          replacements: { zoneId },
          type: QueryTypes.SELECT,
        }
      );
      return zone;
    } catch (error) {
      logger.error(`Error fetching zone ${zoneId}:`, error);
      throw error;
    }
  }

  /**
   * Get a zone by its short name
   */
  async getZoneByShortName(shortName: string) {
    try {
      const [zone] = await sequelize.query(
        `SELECT * FROM zone WHERE short_name = :shortName`,
        {
          replacements: { shortName },
          type: QueryTypes.SELECT,
        }
      );
      return zone;
    } catch (error) {
      logger.error(`Error fetching zone ${shortName}:`, error);
      throw error;
    }
  }

  /**
   * Get all zones
   */
  async getAllZones() {
    try {
      const zones = await sequelize.query(`SELECT * FROM zone`, {
        type: QueryTypes.SELECT,
      });
      return zones;
    } catch (error) {
      logger.error("Error fetching all zones:", error);
      throw error;
    }
  }

  /**
   * Get adjacent zones (zones connected to the specified zone)
   */
  async getAdjacentZones(zoneId: number) {
    try {
      const zone = await this.getZoneById(zoneId);
      if (!zone) return [];

      const zoneShortName = (zone as any).short_name;

      const adjacentZones = await sequelize.query(
        `
        SELECT DISTINCT z.*
        FROM zone_points zp
        JOIN zone z ON zp.target_zone_id = z.zoneidnumber
        WHERE zp.zone = :zoneShortName
        UNION
        SELECT DISTINCT z.*
        FROM zone_points zp
        JOIN zone z ON zp.zone = z.short_name
        WHERE zp.target_zone_id = :zoneId
        `,
        {
          replacements: { zoneShortName, zoneId },
          type: QueryTypes.SELECT,
        }
      );

      return adjacentZones;
    } catch (error) {
      logger.error(`Error fetching adjacent zones for zone ${zoneId}:`, error);
      throw error;
    }
  }

  /**
   * Get NPCs in a zone
   */
  async getZoneNPCs(zoneShortName: string) {
    try {
      // First check if the required tables exist
      const [tables] = await sequelize.query(
        `
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = :dbName 
        AND TABLE_NAME IN ('spawnlocation', 'spawnentry', 'npc_types')
        `,
        {
          replacements: { dbName: process.env.DB_NAME || "database_name" },
          type: QueryTypes.SELECT,
          raw: true,
        }
      );

      // If any of the required tables don't exist, return an empty array
      if (!tables || (Array.isArray(tables) && tables.length < 3)) {
        logger.warn(
          `Missing required tables for NPC lookup in zone ${zoneShortName}`
        );
        return [];
      }

      const npcs = await sequelize.query(
        `
        SELECT DISTINCT nt.*
        FROM spawnlocation sl
        JOIN spawnentry se ON sl.spawngroupID = se.spawngroupID
        JOIN npc_types nt ON se.npcID = nt.id
        WHERE sl.zone = :zoneShortName
        `,
        {
          replacements: { zoneShortName },
          type: QueryTypes.SELECT,
        }
      );

      return npcs || [];
    } catch (error) {
      logger.error(`Error fetching NPCs for zone ${zoneShortName}:`, error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Get NPCs in a zone filtered by player level and level range
   * Similar to the client-side filtering in GameEngine.ts
   */
  async getEligibleZoneNPCs(
    zoneShortName: string,
    playerLevel: number,
    levelRange: number = 99
  ) {
    try {
      // First check if the required tables exist
      const [tables] = await sequelize.query(
        `
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = :dbName 
        AND TABLE_NAME IN ('spawnlocation', 'spawnentry', 'npc_types')
        `,
        {
          replacements: { dbName: process.env.DB_NAME || "database_name" },
          type: QueryTypes.SELECT,
          raw: true,
        }
      );

      // If any of the required tables don't exist, return an empty array
      if (!tables || (Array.isArray(tables) && tables.length < 3)) {
        logger.warn(
          `Missing required tables for NPC lookup in zone ${zoneShortName}`
        );
        return [];
      }

      // Get NPCs within the level range directly from the database
      const eligibleNPCs = await sequelize.query(
        `
        SELECT DISTINCT nt.*
        FROM spawnlocation sl
        JOIN spawnentry se ON sl.spawngroupID = se.spawngroupID
        JOIN npc_types nt ON se.npcID = nt.id
        WHERE sl.zone = :zoneShortName
        AND ABS(COALESCE(nt.level, 1) - :playerLevel) <= :levelRange
        `,
        {
          replacements: {
            zoneShortName,
            playerLevel,
            levelRange,
          },
          type: QueryTypes.SELECT,
        }
      );

      return eligibleNPCs || [];
    } catch (error) {
      logger.error(
        `Error fetching eligible NPCs for zone ${zoneShortName}:`,
        error
      );
      // Return empty array instead of throwing error
      return [];
    }
  }
}

// Export a singleton instance
export default new ZoneService();
