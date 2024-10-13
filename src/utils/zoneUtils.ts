import { getAdjacentZones as getAdjacentZonesFromDB } from "./databaseOperations";
import Zone from "@entities/Zone";

export const getAdjacentZones = async (zoneId: number): Promise<Zone[]> => {
  return getAdjacentZonesFromDB(zoneId);
};
