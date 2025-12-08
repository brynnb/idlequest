import {
  eqDataService,
  type Item,
  type Zone,
  type NPCType,
} from "./eqDataService";

// Legacy function for compatibility - no longer needs initialization
export const initDatabase = async (isTest = false) => {
  // Database is now handled on the server side
  return Promise.resolve();
};

export const getDatabase = () => null;

export const setDatabase = (database: any) => {
  // No longer needed - database is on server
};

export const getById = async <T extends "items" | "zone">(
  table: T,
  id: number
): Promise<T extends "items" ? Item : Zone | undefined> => {
  if (table === "items") {
    return (await eqDataService.getItemById(id)) as any;
  } else {
    return (await eqDataService.getZoneById(id)) as any;
  }
};

export const getByZoneId = async <T extends "items" | "zone">(
  table: T,
  id: number
): Promise<T extends "items" ? Item : Zone | undefined> => {
  if (table === "items") {
    // This doesn't make sense for items, but keeping for compatibility
    return undefined as any;
  } else {
    return (await eqDataService.getZoneByZoneId(id)) as any;
  }
};

export const getItemById = async (id: number): Promise<Item | undefined> => {
  console.log("getItemById", id);
  return (await eqDataService.getItemById(id)) || undefined;
};

export const getAllFromTable = async <T extends "items" | "zone">(
  table: T
): Promise<(T extends "items" ? Item : Zone)[]> => {
  if (table === "items") {
    return (await eqDataService.getAllItems()) as any;
  } else {
    return (await eqDataService.getAllZones()) as any;
  }
};

export const getZoneNPCs = async (zoneName: string): Promise<NPCType[]> => {
  return await eqDataService.getZoneNPCs(zoneName);
};

export const getNPCLoot = async (npcId: number | string): Promise<Item[]> => {
  const numericNpcId = typeof npcId === "string" ? parseInt(npcId, 10) : npcId;

  if (typeof numericNpcId !== "number" || isNaN(numericNpcId)) {
    console.error(
      `Invalid npcId: ${npcId}. Expected a number or numeric string.`
    );
    return [];
  }

  return await eqDataService.getNPCLoot(numericNpcId);
};

export const getAdjacentZones = async (zoneId: number): Promise<Zone[]> => {
  return await eqDataService.getAdjacentZones(zoneId);
};
