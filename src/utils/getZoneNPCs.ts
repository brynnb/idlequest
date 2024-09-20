import { initDatabase, getDatabase } from "./databaseOperations";
import { NPCType } from "../entities/NPCType";
import { zoneCache } from "./zoneCache";

export const getZoneNPCs = async (zoneIDOrName: number | string): Promise<NPCType[]> => {
  await initDatabase();
  const db = getDatabase();
  if (!db) throw new Error("Database not initialized");

  let zoneName: string | undefined;

  if (typeof zoneIDOrName === 'number') {
    zoneName = zoneCache.getNameById(zoneIDOrName);
    if (!zoneName) throw new Error(`Zone with ID ${zoneIDOrName} not found`);
  } else {
    const zoneID = zoneCache.getIdByName(zoneIDOrName);
    if (!zoneID) throw new Error(`Zone with name ${zoneIDOrName} not found`);
    zoneName = zoneIDOrName;
  }

  const query = `
    SELECT DISTINCT nt.*
    FROM spawnlocation sl
    JOIN spawnentry se ON sl.spawngroupID = se.spawngroupID
    JOIN npc_types nt ON se.npcID = nt.id
    WHERE sl.zone = ?
  `;

  try {
    const result = db.exec(query, [zoneName]);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map((row) => {
      const npc: Partial<NPCType> = {};
      columns.forEach((col, index) => {
        npc[col as keyof NPCType] = row[index] as any;
      });
      return npc as NPCType;
    });
  } catch (error) {
    console.error("Error fetching NPCs for zone:", error);
    return [];
  }
};
