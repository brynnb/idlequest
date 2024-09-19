import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";

let db: Database | null = null;
let initializationPromise: Promise<void> | null = null;

export const initDatabase = async (isTest = false) => {
  if (db) return;
  if (initializationPromise) await initializationPromise;
  else {
    initializationPromise = (async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: (file) =>
            isTest
              ? path.join(
                  __dirname,
                  "../../node_modules/sql.js/dist/sql-wasm.wasm"
                )
              : `https://sql.js.org/dist/${file}`,
        });

        let data: Uint8Array;
        if (isTest) {
          const dbPath = path.join(__dirname, "../../data/eq_data.db");
          data = new Uint8Array(fs.readFileSync(dbPath));
        } else {
          const response = await fetch("/data/eq_data.db");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          data = new Uint8Array(arrayBuffer);
        }

        db = new SQL.Database(data);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        throw error;
      }
    })();
    await initializationPromise;
  }
};

export const getDatabase = () => db;

export const setDatabase = (database: Database) => {
  db = database;
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

  return item;};
