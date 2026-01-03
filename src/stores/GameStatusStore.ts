import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { NPCType } from "@entities/NPCType";
import Zone from "@entities/Zone";
import { eqDataService } from "@utils/eqDataService";
import { WorldSocket, OpCodes } from "@/net";

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
  isAbilitiesOpen: boolean;
  toggleAbilities: () => void;
  isTradeskillsOpen: boolean;
  toggleTradeskills: () => void;
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
                // Try to get zones from StaticDataStore first (server-sourced)
                const staticDataStore = await import("./StaticDataStore");
                const staticData = staticDataStore.default.getState();

                // If static data is loaded, use it
                if (staticData.isLoaded && staticData.zones.length > 0) {
                  // Map StaticDataStore zone format to GameStatusStore zone format
                  const mappedZones = staticData.zones.map((z) => ({
                    id: z.id,
                    zoneidnumber: z.zoneidnumber,
                    short_name: z.shortName,
                    long_name: z.longName,
                    safe_x: z.safeX,
                    safe_y: z.safeY,
                    safe_z: z.safeZ,
                    min_level: z.minLevel,
                    max_level: z.maxLevel,
                  }));
                  set({ zones: mappedZones as any });
                  return;
                }

                // Fallback to eqDataService if static data not loaded yet
                const loadedZones = await eqDataService.getAllZones();
                set({ zones: loadedZones as any });
              } catch (error) {
                console.error("Error initializing zones:", error);
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
              set({
                currentZone: zoneId,
                targetNPC: null,
                currentNPCHealth: null,
              });
              await get().updateCurrentZoneNPCs();
            },

            updateCurrentZoneNPCs: async () => {
              const { currentZone, getZoneNameById, zones } = get();
              if (currentZone === null) {
                return;
              }

              // Check if zones are loaded
              if (!zones || zones.length === 0) {
                console.log(
                  "Zones not loaded yet, skipping NPC fetch for zone:",
                  currentZone
                );
                return;
              }

              const zoneName = getZoneNameById(currentZone);
              if (!zoneName) {
                console.warn(
                  "Zone name not found for zone ID:",
                  currentZone,
                  "- available zones:",
                  zones.length
                );
                return;
              }
              try {
                // Server is the only source of NPC data
                const npcs = await eqDataService.getZoneNPCs(zoneName);
                set({ currentZoneNPCs: npcs as unknown as NPCType[] });
              } catch (error) {
                console.error("Failed to fetch zone NPCs:", error);
                set({ currentZoneNPCs: [] });
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
                isAbilitiesOpen: false,
                isInventoryOpen: state.isNoteOpen
                  ? false
                  : state.isInventoryOpen,
                isMapOpen: state.isNoteOpen ? false : state.isMapOpen,
              }));
            },

            isAbilitiesOpen: false,
            toggleAbilities: () => {
              set((state) => ({
                isAbilitiesOpen: !state.isAbilitiesOpen,
                isNoteOpen: false,
                isTradeskillsOpen: false,
                isInventoryOpen: state.isAbilitiesOpen
                  ? false
                  : state.isInventoryOpen,
                isMapOpen: state.isAbilitiesOpen ? false : state.isMapOpen,
              }));
            },

            isTradeskillsOpen: false,
            toggleTradeskills: () => {
              set((state) => ({
                isTradeskillsOpen: !state.isTradeskillsOpen,
                isAbilitiesOpen: false,
                isNoteOpen: false,
                isInventoryOpen: state.isTradeskillsOpen
                  ? false
                  : state.isInventoryOpen,
                isMapOpen: state.isTradeskillsOpen ? false : state.isMapOpen,
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
              const currentState = get().autoSellEnabled;
              const newAutoSellEnabled = !currentState;
              console.log(`[AutoSell] Toggling: ${currentState} -> ${newAutoSellEnabled}`);
              set({ autoSellEnabled: newAutoSellEnabled });

              // Send auto-sell state to server
              // Create raw datagram: 2 bytes opcode (little-endian) + 1 byte payload
              const buffer = new ArrayBuffer(3);
              const view = new DataView(buffer);
              view.setUint16(0, OpCodes.SetAutoSell, true); // little-endian
              view.setUint8(2, newAutoSellEnabled ? 1 : 0);
              console.log(`[AutoSell] Sending opcode ${OpCodes.SetAutoSell} with value ${newAutoSellEnabled ? 1 : 0}`);
              WorldSocket.sendRawDatagram(new Uint8Array(buffer));
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
          onRehydrateStorage: () => () => { },
        }
      ),
      { name: "Game Status Store" }
    )
  )
);

export default useGameStatusStore;
