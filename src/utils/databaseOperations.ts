import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";
import { NPCType } from "@entities/NPCType";
import { Zone } from "@entities/Zone";
import { Item } from "@entities/Item";

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

export const getById = async <T extends "items" | "zone">(
  table: T,
  id: number
): Promise<T extends "items" ? Item : Zone | undefined> => {
  await initDatabase();
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(`SELECT * FROM ${table} WHERE id = ${id}`);
  if (result.length === 0 || result[0].values.length === 0) return undefined;

  const columns = result[0].columns;
  const values = result[0].values[0];
  const item = columns.reduce((obj, col, index) => {
    obj[col] = values[index];
    return obj;
  }, {} as any);

  return item;
};

export const getByZoneId = async <T extends "items" | "zone">(
  table: T,
  id: number
): Promise<T extends "items" ? Item : Zone | undefined> => {
  await initDatabase();
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(`SELECT * FROM ${table} WHERE zoneidnumber = ${id}`);
  if (result.length === 0 || result[0].values.length === 0) return undefined;

  const columns = result[0].columns;
  const values = result[0].values[0];
  const item = columns.reduce((obj, col, index) => {
    obj[col] = values[index];
    return obj;
  }, {} as any);

  return item;
};

export const getItemById = async (id: number): Promise<Item | undefined> => {
  return getById("items", id) as Promise<Item | undefined>;
};

export const getAllFromTable = async <T extends "items" | "zone">(
  table: T
): Promise<(T extends "items" ? Item : Zone)[]> => {
  await initDatabase();
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(`SELECT * FROM ${table}`);
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const item = columns.reduce((obj, col, index) => {
      obj[col] = row[index];
      return obj;
    }, {} as any);
    return item;
  });
};

export const getZoneNPCs = async (zoneName: string): Promise<NPCType[]> => {
  await initDatabase();
  if (!db) throw new Error("Database not initialized");

  const query = `
    SELECT DISTINCT nt.*
    FROM spawnlocation sl
    JOIN spawnentry se ON sl.spawngroupID = se.spawngroupID
    JOIN npc_types nt ON se.npcID = nt.id
    WHERE sl.zone = ?
  `;

  try {
    const result = db.exec(query, [zoneName]);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map((row) => {
      const npc: Partial<NPCType> = {};
      columns.forEach((col, index) => {
        npc[col as keyof NPCType] = row[index] as any;
      });
      return npc as NPCType;
    });
  } catch (error) {
    console.error("Error fetching zone NPCs:", error);
    return [];
  }
};

export const getNPCLoot = async (npcId: number | string): Promise<Item[]> => {
  const numericNpcId = typeof npcId === "string" ? parseInt(npcId, 10) : npcId;

  if (typeof numericNpcId !== "number" || isNaN(numericNpcId)) {
    console.error(
      `Invalid npcId: ${npcId}. Expected a number or numeric string.`
    );
    return [];
  }

  await initDatabase();
  if (!db) throw new Error("Database not initialized");

  const query = `
    SELECT DISTINCT i.*, lde.chance
    FROM items i
    JOIN lootdrop_entries lde ON i.id = lde.item_id
    JOIN loottable_entries lte ON lde.lootdrop_id = lte.lootdrop_id
    JOIN npc_types nt ON lte.loottable_id = nt.loottable_id
    WHERE nt.id = ?
  `;

  try {
    const result = db.exec(query, [numericNpcId]);

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const loot = result[0].values.map((row) => {
      const item: Partial<Item> = {};
      let dropChance = 0;
      columns.forEach((col, index) => {
        if (col === "chance") {
          dropChance = row[index] as number;
        } else {
          item[col as keyof Item] = row[index] as any;
        }
      });
      return { item, dropChance };
    });

    const finalLoot = loot
      .filter(({ dropChance }) => {
        return Math.random() * 100 < dropChance;
      })
      .map(({ item }) => item as Item);

    return finalLoot;
  } catch (error) {
    console.error("Error fetching loot for NPC:", error);
    return [];
  }
};

export const getAdjacentZones = async (zoneId: number): Promise<Zone[]> => {
  const zone = await getByZoneId("zone", zoneId);
  if (!zone) return [];
  const zoneShortName = zone.short_name;

  await initDatabase();
  if (!db) throw new Error("Database not initialized");

  const query = `
    SELECT DISTINCT z.*
    FROM zone_points zp
    JOIN zone z ON zp.target_zone_id = z.zoneidnumber
    WHERE zp.zone = ?
    UNION
    SELECT DISTINCT z.*
    FROM zone_points zp
    JOIN zone z ON zp.zone = z.short_name
    WHERE zp.target_zone_id = (SELECT zoneidnumber FROM zone WHERE short_name = ?)
  `;

  try {
    const result = db.exec(query, [zoneShortName, zoneShortName]);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map((row) => {
      const zone: Partial<Zone> = {};
      columns.forEach((col, index) => {
        zone[col as keyof Zone] = row[index] as any;
      });
      return zone as Zone;
    });
  } catch (error) {
    console.error("Error fetching adjacent zones:", error);
    return [];
  }
};
