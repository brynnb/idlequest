import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { NPCType } from "../entities/NPCType";
import { getZoneNPCs } from "../utils/getZoneNPCs";
import Zone from "../entities/Zone";
import { useDatabase } from "../hooks/useDatabase";

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

          const { getAllFromTable, loading } = useDatabase<'zone'>();
          if (loading) return;

          try {
            const newZones = await getAllFromTable('zone');
            set({ zones: newZones });
          } catch (error) {
            console.error("Error initializing zones:", error);
            throw new Error("Failed to initialize zones");
          }
        },

        getZoneNameById: (id) => {
          const zone = get().zones.find(z => z.zoneidnumber == id);
          return zone?.short_name;
        },

        getZoneIdByName: (name) => {
          const zone = get().zones.find(z => z.short_name == name);
          return zone?.zoneidnumber;
        },

        getZoneLongNameById: (id) => {
          const zone = get().zones.find(z => z.zoneidnumber == id);
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
            } else {
              console.error("Zone name not found for current zone:", currentZone);
            }
          } else {
            console.error("Current zone is null");
          }
        },
      }),
      { name: "game-status-storage" }
    ),
    { name: "Game Status Store" }
  )
);

export default useGameStatusStore;