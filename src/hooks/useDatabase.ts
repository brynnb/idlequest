import { useCallback, useEffect, useState } from "react";
import initSqlJs, { Database } from "sql.js";
import Zone from "../entities/Zone";

type TableTypes = {
  items: Item;
  zone: Zone;
};

export const useDatabase = <T extends keyof TableTypes>() => {
  const [db, setDb] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDb = async () => {
      setLoading(true);
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
      });
      const response = await fetch("/data/eq_data.db");
      const arrayBuffer = await response.arrayBuffer();
      const uInt8Array = new Uint8Array(arrayBuffer);
      setDb(new SQL.Database(uInt8Array));
      setLoading(false);
    };

    initDb();
  }, []);

  const getById = useCallback(
    async (table: T, id: number): Promise<TableTypes[T] | undefined> => {
      if (!db) return undefined;

      const result = db.exec(`SELECT * FROM ${table} WHERE id = ${id}`);
      if (result.length === 0 || result[0].values.length === 0)
        return undefined;

      const columns = result[0].columns;
      const values = result[0].values[0];
      const item = columns.reduce((obj, col, index) => {
        obj[col] = values[index];
        return obj;
      }, {} as any);

      return item as TableTypes[T];
    },
    [db]
  );

  const getAllFromTable = useCallback(
    async (table: T): Promise<TableTypes[T][]> => {
      if (!db) return [];

      const result = db.exec(`SELECT * FROM ${table}`);
      if (result.length === 0) return [];

      const columns = result[0].columns;
      return result[0].values.map((row) => {
        const item = columns.reduce((obj, col, index) => {
          obj[col] = row[index];
          return obj;
        }, {} as any);
        return item as TableTypes[T];
      });
    },
    [db]
  );

  return { getById, getAllFromTable, loading };
};
