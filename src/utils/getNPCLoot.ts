import { getNPCLoot as getNPCLootFromDB } from "./databaseOperations";
import { Item } from "../entities/Item";

export const getNPCLoot = async (npcId: number): Promise<Item[]> => {
  return getNPCLootFromDB(npcId);
};
