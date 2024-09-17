import initSqlJs, { Database } from "sql.js";

let db: Database | null = null;
let initializationPromise: Promise<void> | null = null;

export const initDatabase = async () => {
  if (db) return;
  if (initializationPromise) await initializationPromise;
  else {
    initializationPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      const response = await fetch("/data/eq_data.db");
      const arrayBuffer = await response.arrayBuffer();
      const uInt8Array = new Uint8Array(arrayBuffer);
      db = new SQL.Database(uInt8Array);
    })();
    await initializationPromise;
  }
};

export const getItemById = async (id: number): Promise<any | undefined> => {
  await initDatabase();
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(`SELECT * FROM items WHERE id = ${id}`);
  if (result.length === 0 || result[0].values.length === 0) return undefined;

  const columns = result[0].columns;
  const values = result[0].values[0];
  const item = columns.reduce((obj, col, index) => {
    obj[col] = values[index];
    return obj;
  }, {} as any);

  return item;
};