import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { initDatabase, getDatabase } from "../utils/databaseOperations";
import { NPCType } from "../entities/NPCType";
import { getZoneNPCs } from "../utils/getZoneNPCs";
import Zone from "../entities/Zone";

interface GameStatusStore {
  zones: Zone[];
  currentZone: number | null;
  currentZoneNPCs: NPCType[];

  initializeZones: (forceReload?: boolean) => Promise<void>;
  getZoneNameById: (id: number) => string | undefined;
  getZoneIdByName: (name: string) => number | undefined;
  getZoneLongNameById: (id: number) => string | undefined;
  setCurrentZone: (zoneId: number) => Promise<void>;
  updateCurrentZoneNPCs: () => Promise<void>;
}

const useGameStatusStore = create<GameStatusStore>()(
  devtools(
    persist(
      (set, get) => ({
        zones: [],
        currentZone: null,
        currentZoneNPCs: [],

        initializeZones: async (forceReload = false) => {
          const { zones } = get();
          if (!forceReload && zones.length > 0) return;

          await initDatabase();
          const db = getDatabase();
          if (!db) throw new Error("Database not initialized");

          try {
            const result = db.exec("SELECT * FROM zone");
            if (result.length > 0) {
              const newZones = result[0].values.map((row) => {
                const zone: Zone = {} as Zone;
                result[0].columns.forEach((col, index) => {
                  (zone as any)[col] = row[index];
                });
                return zone;
              });
              set({ zones: newZones });
            } else {
              console.warn("Zone table is empty or not found");
            }
          } catch (error) {
            console.error("Error initializing zones:", error);
            throw new Error("Failed to initialize zones");
          }
        },

        getZoneNameById: (id) => {
          const zone = get().zones.find(z => z.zoneidnumber === id);
          return zone?.short_name;
        },

        getZoneIdByName: (name) => {
          const zone = get().zones.find(z => z.short_name === name);
          return zone?.zoneidnumber;
        },

        getZoneLongNameById: (id) => {
          const zone = get().zones.find(z => z.zoneidnumber === id);
          console.log("zone", zone);
          console.log("id", id);
          console.log("zone?.long_name", zone?.long_name);
          //console log zones
          console.log("zones", get().zones);
          return zone?.long_name;
        },

        setCurrentZone: async (zoneId) => {
          set({ currentZone: zoneId });
          await get().updateCurrentZoneNPCs();
        },

        updateCurrentZoneNPCs: async () => {
          const { currentZone, getZoneNameById } = get();
          if (currentZone !== null) {
            const zoneName = getZoneNameById(currentZone);
            if (zoneName) {
              try {
                const npcs = await getZoneNPCs(zoneName);
                set({ currentZoneNPCs: npcs });
              } catch (error) {
                console.error("Failed to update current zone NPCs:", error);
              }
            }
          }
        },
      }),
      { name: "game-status-storage" }
    ),
    { name: "Game Status Store" }
  )
);

export default useGameStatusStore;