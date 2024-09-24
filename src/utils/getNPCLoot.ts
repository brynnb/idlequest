import { getZoneNPCs, getNPCLoot as getNPCLootFromDB } from "./databaseOperations";
import { Item } from "../entities/Item";
import useGameStatusStore from "../stores/GameStatusStore";

export const getNPCLoot = async (zoneID: number): Promise<Item[]> => {
  const getZoneNameById = useGameStatusStore.getState().getZoneNameById;
  const zoneName = getZoneNameById(zoneID);
  if (!zoneName) throw new Error(`Zone with ID ${zoneID} not found`);

  const npcs = await getZoneNPCs(zoneName);
  if (npcs.length === 0) return [];

  const firstNPC = npcs[0];
  return getNPCLootFromDB(firstNPC.id);
};