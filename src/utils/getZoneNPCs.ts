import { initDatabase, getDatabase } from "./databaseOperations";
import { NPCType } from "../entities/NPCType";
import useGameStatusStore from "../stores/GameStatusStore";

export const getZoneNPCs = async (zoneIDOrName: number | string): Promise<NPCType[]> => {
  await initDatabase();
  const db = getDatabase();
  if (!db) throw new Error("Database not initialized");

  const { getZoneNameById, getZoneIdByName } = useGameStatusStore.getState();

  let zoneName: string | undefined;

  if (typeof zoneIDOrName === 'number') {
    zoneName = getZoneNameById(zoneIDOrName);
    if (!zoneName) throw new Error(`Zone with ID ${zoneIDOrName} not found`);
  } else {
    const zoneID = getZoneIdByName(zoneIDOrName);
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
    return [];
  }
};
