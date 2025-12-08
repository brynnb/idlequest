import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database | null = null;
let initializationPromise: Promise<void> | null = null;

export const initEQDatabase = async () => {
  if (db) return;
  if (initializationPromise) await initializationPromise;
  else {
    initializationPromise = (async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: (file) => {
            return path.join(
              __dirname,
              "../../../node_modules/sql.js/dist/sql-wasm.wasm"
            );
          },
        });

        // Look for the EQ database file
        const dbPath = path.join(__dirname, "../../../data/db/eq_data.db");
        const data = new Uint8Array(fs.readFileSync(dbPath));

        db = new SQL.Database(data);
        console.log("EQ Database initialized successfully");
      } catch (error) {
        console.error("Failed to initialize EQ database:", error);
        throw error;
      }
    })();
    await initializationPromise;
  }
};

export const getEQDatabase = () => db;

export interface Item {
  id: number;
  name: string;
  [key: string]: any;
}

export interface Zone {
  id: number;
  zoneidnumber: number;
  short_name: string;
  long_name?: string;
  [key: string]: any;
}

export interface NPCType {
  id: number;
  name: string;
  [key: string]: any;
}

export const getItemById = async (id: number): Promise<Item | null> => {
  await initEQDatabase();
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(`SELECT * FROM items WHERE id = ${id}`);
  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const values = result[0].values[0];
  const item = columns.reduce((obj: any, col, index) => {
    obj[col] = values[index];
    return obj;
  }, {});

  return item;
};

export const getZoneById = async (id: number): Promise<Zone | null> => {
  await initEQDatabase();
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(`SELECT * FROM zone WHERE id = ${id}`);
  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const values = result[0].values[0];
  const zone = columns.reduce((obj: any, col, index) => {
    obj[col] = values[index];
    return obj;
  }, {});

  return zone;
};

export const getZoneByZoneId = async (
  zoneidnumber: number
): Promise<Zone | null> => {
  await initEQDatabase();
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(
    `SELECT * FROM zone WHERE zoneidnumber = ${zoneidnumber}`
  );
  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const values = result[0].values[0];
  const zone = columns.reduce((obj: any, col, index) => {
    obj[col] = values[index];
    return obj;
  }, {});

  return zone;
};

export const getZoneNPCs = async (zoneName: string): Promise<NPCType[]> => {
  await initEQDatabase();
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
      const npc: any = {};
      columns.forEach((col, index) => {
        npc[col] = row[index];
      });
      return npc;
    });
  } catch (error) {
    console.error("Error fetching zone NPCs:", error);
    return [];
  }
};

export const getNPCLoot = async (npcId: number): Promise<Item[]> => {
  await initEQDatabase();
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
    const result = db.exec(query, [npcId]);

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const loot = result[0].values.map((row) => {
      const item: any = {};
      let dropChance = 0;
      columns.forEach((col, index) => {
        if (col === "chance") {
          dropChance = row[index] as number;
        } else {
          item[col] = row[index];
        }
      });
      return { item, dropChance };
    });

    const finalLoot = loot
      .filter(({ dropChance }: any) => {
        return Math.random() * 100 < dropChance;
      })
      .map(({ item }: any) => item);

    return finalLoot;
  } catch (error) {
    console.error("Error fetching loot for NPC:", error);
    return [];
  }
};

export const getAdjacentZones = async (zoneId: number): Promise<Zone[]> => {
  const zone = await getZoneByZoneId(zoneId);
  if (!zone) return [];
  const zoneShortName = zone.short_name;

  await initEQDatabase();
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
      const zone: any = {};
      columns.forEach((col, index) => {
        zone[col] = row[index];
      });
      return zone;
    });
  } catch (error) {
    console.error("Error fetching adjacent zones:", error);
    return [];
  }
};

export const getAllItems = async (): Promise<Item[]> => {
  await initEQDatabase();
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(`SELECT * FROM items`);
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const item: any = {};
    columns.forEach((col, index) => {
      item[col] = row[index];
    });
    return item;
  });
};

export const getAllZones = async (): Promise<Zone[]> => {
  await initEQDatabase();
  if (!db) throw new Error("Database not initialized");

  const result = db.exec(`SELECT * FROM zone`);
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const zone: any = {};
    columns.forEach((col, index) => {
      zone[col] = row[index];
    });
    return zone;
  });
};
