import { useCallback, useEffect, useState } from "react";
import {
  initDatabase,
  getById,
  getAllFromTable,
  getZoneNPCs,
} from "@utils/databaseOperations";
import type { Item, Zone, NPCType } from "@utils/eqDataService";

type TableTypes = {
  items: Item;
  zone: Zone;
};

export const useDatabase = <T extends "items" | "zone">() => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await initDatabase();
      setLoading(false);
    };

    init();
  }, []);

  const getByIdHook = useCallback(
    async (table: T, id: number): Promise<TableTypes[T] | undefined> => {
      return getById(table, id) as Promise<TableTypes[T] | undefined>;
    },
    []
  );

  const getAllFromTableHook = useCallback(
    async (table: T): Promise<TableTypes[T][]> => {
      return getAllFromTable(table) as Promise<TableTypes[T][]>;
    },
    []
  );

  const getZoneNPCsHook = useCallback(
    async (zoneName: string): Promise<NPCType[]> => {
      return getZoneNPCs(zoneName);
    },
    []
  );

  return {
    getById: getByIdHook,
    getAllFromTable: getAllFromTableHook,
    getZoneNPCs: getZoneNPCsHook,
    loading,
  };
};
