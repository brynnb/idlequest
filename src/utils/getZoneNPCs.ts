import {
  initDatabase,
  getZoneNPCs as fetchZoneNPCs,
} from "./databaseOperations";
import { NPCType } from "@entities/NPCType";
import useGameStatusStore from "@stores/GameStatusStore";

export const getZoneNPCs = async (
  zoneIDOrName: number | string
): Promise<NPCType[]> => {
  await initDatabase();

  const { getZoneNameById, getZoneIdByName } = useGameStatusStore.getState();

  let zoneName: string;

  if (typeof zoneIDOrName === "number") {
    const name = getZoneNameById(zoneIDOrName);
    if (!name) throw new Error(`Zone with ID ${zoneIDOrName} not found`);
    zoneName = name;
  } else {
    const zoneID = getZoneIdByName(zoneIDOrName);
    if (!zoneID) throw new Error(`Zone with name ${zoneIDOrName} not found`);
    zoneName = zoneIDOrName;
  }

  return (await fetchZoneNPCs(zoneName)) as unknown as NPCType[];
};
