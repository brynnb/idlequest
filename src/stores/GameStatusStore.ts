import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { NPCType } from "@entities/NPCType";
import Zone from "@entities/Zone";
import { eqDataService } from "@utils/eqDataService";

interface ContainerPosition {
  x: number;
  y: number;
}

interface GameStatusStore {
  zones: Zone[];
  currentZone: number | null;
  currentZoneNPCs: NPCType[];
  targetNPC: NPCType | null;
  currentNPCHealth: number | null;
  isRunning: boolean;
  quickMode: boolean;
  autoSellEnabled: boolean;
  deleteNoDrop: boolean;
  isMuted: boolean;
  currentVideoIndex: number;
  setInitialVideoIndex: (index: number) => void;
  cycleVideo: () => void;
  toggleAutoSell: () => void;
  toggleDeleteNoDrop: () => void;
  toggleMute: () => void;
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
  isMapOpen: boolean;
  toggleMap: () => void;
  isSpellbookOpen: boolean;
  toggleSpellbook: () => void;
  isNoteOpen: boolean;
  toggleNote: () => void;
  containerPositions: Record<number, ContainerPosition>;
  setContainerPosition: (bagSlot: number, position: ContainerPosition) => void;
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
            autoSellEnabled: false,
            deleteNoDrop: true,
            isMuted: true,
            currentVideoIndex: -1,

            setInitialVideoIndex: (index: number) => {
              const { currentVideoIndex } = get();
              if (currentVideoIndex === -1) {
                set({ currentVideoIndex: index });
              }
            },

            cycleVideo: () => {
              set((state) => ({
                currentVideoIndex: state.currentVideoIndex + 1,
              }));
            },

            toggleMute: () => {
              set((state) => ({
                isMuted: !state.isMuted,
              }));
            },

            initializeZones: async (forceReload = false) => {
              const { zones } = get();
              if (!forceReload && zones.length > 0) return;

              try {
                // Use eqDataService for consistent data access (will show warning until WebTransport is implemented)
                const newZones = await eqDataService.getAllZones();
                if (newZones.length > 0) {
                  set({ zones: newZones });
                } else {
                  // Fallback to old database operations if eqDataService returns empty
                  const { getAllFromTable } = await import(
                    "@utils/databaseOperations"
                  );
                  const fallbackZones = await getAllFromTable("zone");
                  set({ zones: fallbackZones });
                  console.warn(
                    "Using fallback database operations for zones - WebTransport not yet implemented"
                  );
                }
              } catch (error) {
                console.error("Error initializing zones:", error);
                // Try fallback as well
                try {
                  const { getAllFromTable } = await import(
                    "@utils/databaseOperations"
                  );
                  const fallbackZones = await getAllFromTable("zone");
                  set({ zones: fallbackZones });
                  console.warn(
                    "Used fallback database operations due to error in eqDataService"
                  );
                } catch (fallbackError) {
                  console.error("Fallback also failed:", fallbackError);
                  throw new Error("Failed to initialize zones");
                }
              }
            },

            getZoneNameById: (id) => {
              const zones = get().zones;
              if (!Array.isArray(zones)) return undefined;
              const zone = zones.find((z) => z.zoneidnumber == id);
              return zone?.short_name;
            },

            getZoneIdByName: (name) => {
              const zones = get().zones;
              if (!Array.isArray(zones)) return undefined;
              const zone = zones.find((z) => z.short_name == name);
              return zone?.zoneidnumber;
            },

            getZoneLongNameById: (id) => {
              const zones = get().zones;
              if (!Array.isArray(zones)) return undefined;
              const zone = zones.find((z) => z.zoneidnumber == id);
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
                    // Use eqDataService for consistent data access
                    const npcs = await eqDataService.getZoneNPCs(zoneName);
                    if (npcs.length > 0) {
                      set({ currentZoneNPCs: npcs });
                    } else {
                      // Fallback to old getZoneNPCs function if eqDataService returns empty
                      const { getZoneNPCs } = await import(
                        "@utils/getZoneNPCs"
                      );
                      const fallbackNpcs = await getZoneNPCs(zoneName);
                      set({ currentZoneNPCs: fallbackNpcs });
                      console.warn(
                        "Used fallback getZoneNPCs function - WebTransport not yet implemented"
                      );
                    }
                  } catch (error) {
                    console.error("Failed to update current zone NPCs:", error);
                    // Try fallback
                    try {
                      const { getZoneNPCs } = await import(
                        "@utils/getZoneNPCs"
                      );
                      const fallbackNpcs = await getZoneNPCs(zoneName);
                      set({ currentZoneNPCs: fallbackNpcs });
                      console.warn(
                        "Used fallback getZoneNPCs due to error in eqDataService"
                      );
                    } catch (fallbackError) {
                      console.error(
                        "Fallback getZoneNPCs also failed:",
                        fallbackError
                      );
                    }
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
              set((state) => ({
                isInventoryOpen: !state.isInventoryOpen,
                isMapOpen: state.isInventoryOpen ? false : state.isMapOpen,
              }));
            },

            isMapOpen: false,
            toggleMap: () => {
              set((state) => ({
                isMapOpen: !state.isMapOpen,
                isInventoryOpen: state.isMapOpen
                  ? false
                  : state.isInventoryOpen,
              }));
            },

            isSpellbookOpen: false,
            toggleSpellbook: () => {
              set((state) => ({
                isSpellbookOpen: !state.isSpellbookOpen,
                isInventoryOpen: state.isSpellbookOpen
                  ? false
                  : state.isInventoryOpen,
                isMapOpen: state.isSpellbookOpen ? false : state.isMapOpen,
              }));
            },

            isNoteOpen: false,
            toggleNote: () => {
              set((state) => ({
                isNoteOpen: !state.isNoteOpen,
                isInventoryOpen: state.isNoteOpen
                  ? false
                  : state.isInventoryOpen,
                isMapOpen: state.isNoteOpen ? false : state.isMapOpen,
              }));
            },

            containerPositions: {},
            setContainerPosition: (bagSlot, position) => {
              set((state) => ({
                containerPositions: {
                  ...state.containerPositions,
                  [bagSlot]: position,
                },
              }));
            },

            toggleAutoSell: () => {
              set((state) => ({
                autoSellEnabled: !state.autoSellEnabled,
              }));
            },

            toggleDeleteNoDrop: () => {
              set((state) => ({
                deleteNoDrop: !state.deleteNoDrop,
              }));
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
