import { initDatabase, getDatabase } from "./databaseOperations";

class ZoneCache {
  private idToName: Map<number, string> = new Map();
  private nameToId: Map<string, number> = new Map();
  private idToLongName: Map<number, string> = new Map();

  async initialize(forceReload = false) {
    if (!forceReload && this.idToName.size > 0) return;

    await initDatabase(); // Ensure database is initialized
    const db = getDatabase();
    if (!db) throw new Error("Database not initialized");

    try {
      const result = db.exec(
        "SELECT zoneidnumber, short_name, long_name FROM zone"
      );
      if (result.length > 0) {
        this.idToName.clear();
        this.nameToId.clear();
        this.idToLongName.clear();
        result[0].values.forEach(([zoneidnumber, name, longName]) => {
          const id = Number(zoneidnumber);
          this.idToName.set(id, name as string);
          this.nameToId.set(name as string, id);
          this.idToLongName.set(id, longName as string);
        });
      } else {
        console.warn("Zone table is empty or not found");
      }
    } catch (error) {
      console.error("Error initializing ZoneCache:", error);
      throw new Error("Failed to initialize ZoneCache");
    }
  }

  getNameById(id: number): string | undefined {
    return this.idToName.get(id);
  }

  getIdByName(name: string): number | undefined {
    return this.nameToId.get(name);
  }

  getLongNameById(id: number): string | undefined {
    return this.idToLongName.get(id);
  }
}

export const zoneCache = new ZoneCache();