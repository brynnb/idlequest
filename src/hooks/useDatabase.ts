import { useCallback, useEffect, useState } from "react";
import {
  initDatabase,
  getById,
  getAllFromTable,
  getZoneNPCs,
} from "@utils/databaseOperations";
import { Item } from "@entities/Item";
import { Zone } from "@entities/Zone";
import { NPCType } from "@entities/NPCType";

type TableTypes = {
  items: Item;
  zone: Zone;
};

export const useDatabase = <T extends keyof TableTypes>() => {
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
      return getById(table, id);
    },
    []
  );

  const getAllFromTableHook = useCallback(
    async (table: T): Promise<TableTypes[T][]> => {
      return getAllFromTable(table);
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
