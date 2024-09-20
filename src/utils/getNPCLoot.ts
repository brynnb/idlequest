import { initDatabase, getDatabase } from "./databaseOperations";
import { getZoneNPCs } from "./getZoneNPCs";
import { Item } from "../entities/Item";
import { zoneCache } from "./zoneCache";

export const getNPCLoot = async (zoneID: number): Promise<Item[]> => {
  await initDatabase();
  const db = getDatabase();
  if (!db) throw new Error("Database not initialized");

  // Get the zone name from the cache
  const zoneName = zoneCache.getNameById(zoneID);
  if (!zoneName) throw new Error(`Zone with ID ${zoneID} not found`);

  const npcs = await getZoneNPCs(zoneID);
  if (npcs.length === 0) return [];

  const firstNPC = npcs[0];

  const query = `
    SELECT DISTINCT i.*
    FROM items i
    JOIN lootdrop_entries lde ON i.id = lde.item_id
    JOIN loottable_entries lte ON lde.lootdrop_id = lte.lootdrop_id
    JOIN npc_types nt ON lte.loottable_id = nt.loottable_id
    WHERE nt.id = ?
  `;

  try {
    const result = db.exec(query, [firstNPC.id]);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map((row) => {
      const item: Partial<Item> = {};
      columns.forEach((col, index) => {
        item[col as keyof Item] = row[index] as any;
      });
      return item as Item;
    });
  } catch (error) {
    console.error("Error fetching loot for NPC:", error);
    return [];
  }
};
