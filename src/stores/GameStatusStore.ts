import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { NPCType } from "@entities/NPCType";
import { getZoneNPCs } from "@utils/getZoneNPCs";
import Zone from "@entities/Zone";
import { useDatabase } from "@hooks/useDatabase";

interface GameStatusStore {
  zones: Zone[];
  currentZone: number | null;
  currentZoneNPCs: NPCType[];
  targetNPC: NPCType | null;
  currentNPCHealth: number | null;
  isRunning: boolean;
  quickMode: boolean;
  initializeZones: (forceReload?: boolean) => Promise<void>;
  getZoneNameById: (id: number) => string | undefined;
  getZoneIdByName: (name: string) => number | undefined;
  getZoneLongNameById: (id: number) => string | undefined;
  setCurrentZone: (zoneId: number) => Promise<void>;
  updateCurrentZoneNPCs: () => Promise<void>;
  setTargetNPC: (npc: NPCType) => void;
  setIsRunning: (isRunning: boolean) => void;
  toggleRunning: () => void;
  setQuickMode: (quickMode: boolean) => void;
  toggleQuickMode: () => void;
  isInventoryOpen: boolean;
  toggleInventory: () => void;
}

const defaultIsRunning = true;
const defaultQuickMode = true;

const useGameStatusStore = create<GameStatusStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => {
          return {
            zones: [],
            currentZone: null,
            currentZoneNPCs: [],
            targetNPC: null,
            currentNPCHealth: null,
            isRunning: defaultIsRunning,
            quickMode: defaultQuickMode,

            initializeZones: async (forceReload = false) => {
              const { zones } = get();
              if (!forceReload && zones.length > 0) return;

              const { getAllFromTable, loading } = useDatabase<"zone">();
              if (loading) return;

              try {
                const newZones = await getAllFromTable("zone");
                set({ zones: newZones });
              } catch (error) {
                console.error("Error initializing zones:", error);
                throw new Error("Failed to initialize zones");
              }
            },

            getZoneNameById: (id) => {
              const zone = get().zones.find((z) => z.zoneidnumber == id);
              return zone?.short_name;
            },

            getZoneIdByName: (name) => {
              const zone = get().zones.find((z) => z.short_name == name);
              return zone?.zoneidnumber;
            },

            getZoneLongNameById: (id) => {
              const zone = get().zones.find((z) => z.zoneidnumber == id);
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
                  console.error(
                    "Zone name not found for current zone:",
                    currentZone
                  );
                }
              } else {
                console.error("Current zone is null");
              }
            },

            setTargetNPC: (npc: NPCType) => {
              set({
                targetNPC: npc,
                currentNPCHealth: Number(npc.hp) || 0,
              });
            },

            setIsRunning: (isRunning: boolean) => {
              set({ isRunning });
              console.log(`Auto-attack ${isRunning ? "started" : "stopped"}`);
            },

            toggleRunning: () => {
              const currentIsRunning = get().isRunning;
              get().setIsRunning(!currentIsRunning);
            },

            setQuickMode: (quickMode: boolean) => {
              set({ quickMode });
              console.log(`Quick mode ${quickMode ? "enabled" : "disabled"}`);
            },

            toggleQuickMode: () => {
              const currentQuickMode = get().quickMode;
              get().setQuickMode(!currentQuickMode);
            },

            isInventoryOpen: false,
            toggleInventory: () => {
              set({ isInventoryOpen: !get().isInventoryOpen });
            },
          };
        },
        {
          name: "game-status-storage",
          onRehydrateStorage: () => (state) => {},
        }
      ),
      { name: "Game Status Store" }
    )
  )
);

export default useGameStatusStore;
