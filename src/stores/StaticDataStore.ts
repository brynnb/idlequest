import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  WorldSocket,
  OpCodes,
  StaticDataRequest,
  StaticDataResponse,
  CharCreateDataRequest,
  CharCreateDataResponse,
} from "@/net";

export interface RaceData {
  id: number;
  name: string;
  no_coin: number;
  is_playable?: boolean;
  short_name?: string;
  bitmask?: number;
}

export interface ClassData {
  id: number;
  bitmask: number | null;
  name: string;
  short_name?: string;
  spell_list_id: number | null;
  create_points: number;
  first_title: string;
  second_title: string;
  third_title: string;
}

export interface DeityData {
  id: number;
  name: string;
  bitmask: number;
  spells_id: number | null;
  description: string;
  alt_name?: string;
}

export interface ZoneData {
  id: number;
  zoneidnumber: number;
  short_name: string;
  long_name: string;
  safe_x: number;
  safe_y: number;
  safe_z: number;
  min_level: number;
  max_level: number;
}

export interface CharCreateCombinationData {
  allocationId: number;
  race: number;
  class: number;
  deity: number;
  startZone: number;
  expansionsReq: number;
}

export interface CharCreatePointAllocationData {
  id: number;
  baseStr: number;
  baseSta: number;
  baseDex: number;
  baseAgi: number;
  baseInt: number;
  baseWis: number;
  baseCha: number;
  allocStr: number;
  allocSta: number;
  allocDex: number;
  allocAgi: number;
  allocInt: number;
  allocWis: number;
  allocCha: number;
}

export interface CombinationDescriptionData {
  raceId: number;
  classId: number;
  deityId: number;
  description: string;
}

export interface StartZoneData {
  x: number;
  y: number;
  z: number;
  heading: number;
  zoneIdNumber: number;
  playerClass: number;
  playerDeity: number;
  playerRace: number;
}

export interface ZoneDescriptionData {
  zoneId: number;
  description: string;
  welcome: string;
}

interface StaticDataStore {
  isLoaded: boolean;
  isLoading: boolean;
  isCharCreateLoaded: boolean;
  isLoadingCharCreate: boolean;
  error: string | null;
  zones: ZoneData[];
  races: RaceData[];
  classes: ClassData[];
  deities: DeityData[];
  charCreateCombinations: CharCreateCombinationData[];
  charCreatePointAllocations: CharCreatePointAllocationData[];
  combinationDescriptions: CombinationDescriptionData[];
  startZones: StartZoneData[];
  zoneDescriptions: ZoneDescriptionData[];
  loadStaticData: () => Promise<void>;
  loadCharCreateData: () => Promise<void>;
  getRaceById: (id: number) => RaceData | undefined;
  getClassById: (id: number) => ClassData | undefined;
  getDeityById: (id: number) => DeityData | undefined;
  getZoneByZoneIdNumber: (zoneidnumber: number) => ZoneData | undefined;
  getCombinationDescription: (raceId: number, classId: number, deityId: number) => string | undefined;
  getZoneDescription: (zoneId: number) => ZoneDescriptionData | undefined;
}

const useStaticDataStore = create<StaticDataStore>()(
  devtools(
    (set, get) => ({
      isLoaded: false,
      isLoading: false,
      isCharCreateLoaded: false,
      isLoadingCharCreate: false,
      error: null,
      zones: [],
      races: [],
      classes: [],
      deities: [],
      charCreateCombinations: [],
      charCreatePointAllocations: [],
      combinationDescriptions: [],
      startZones: [],
      zoneDescriptions: [],

      loadStaticData: async () => {
        const { isLoaded, isLoading } = get();
        if (isLoaded || isLoading) return;

        set({ isLoading: true, error: null });

        try {
          if (!WorldSocket.isConnected) {
            throw new Error("WorldSocket not connected");
          }

          const response = await WorldSocket.sendRequest(
            OpCodes.StaticDataRequest,
            OpCodes.StaticDataResponse,
            StaticDataRequest,
            StaticDataResponse,
            {}
          );

          if (!response.success) {
            throw new Error(response.error || "Failed to load static data");
          }

          // Parse zones
          const zones: ZoneData[] = [];
          for (let i = 0; i < response.zones.length; i++) {
            const z = response.zones.get(i);
            zones.push({
              id: z.id,
              zoneidnumber: z.zoneidnumber,
              short_name: z.shortName,
              long_name: z.longName,
              safe_x: z.safeX,
              safe_y: z.safeY,
              safe_z: z.safeZ,
              min_level: z.minLevel,
              max_level: z.maxLevel,
            });
          }

          // Parse races
          const races: RaceData[] = [];
          for (let i = 0; i < response.races.length; i++) {
            const r = response.races.get(i);
            races.push({
              id: r.id,
              name: r.name,
              no_coin: r.noCoin,
              is_playable: r.isPlayable === 1,
              short_name: r.shortName,
              bitmask: r.bitmask,
            });
          }

          // Parse classes
          const classes: ClassData[] = [];
          for (let i = 0; i < response.classes.length; i++) {
            const c = response.classes.get(i);
            classes.push({
              id: c.id,
              bitmask: c.bitmask,
              name: c.name,
              short_name: c.shortName,
              create_points: c.createPoints,
              spell_list_id: c.spellListId || null,
              first_title: c.firstTitle || "",
              second_title: c.secondTitle || "",
              third_title: c.thirdTitle || "",
            });
          }

          // Parse deities
          const deities: DeityData[] = [];
          for (let i = 0; i < response.deities.length; i++) {
            const d = response.deities.get(i);
            deities.push({
              id: d.id,
              name: d.name,
              bitmask: d.bitmask,
              description: d.description,
              spells_id: d.spellsId || null,
              alt_name: d.altName || undefined,
            });
          }

          set({
            isLoaded: true,
            isLoading: false,
            zones,
            races,
            classes,
            deities,
          });

          console.log(
            `[StaticData] Loaded: ${zones.length} zones, ${races.length} races, ${classes.length} classes, ${deities.length} deities`
          );
        } catch (error) {
          console.error("Failed to load static data:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },

      loadCharCreateData: async () => {
        const { isCharCreateLoaded, isLoadingCharCreate } = get();
        if (isCharCreateLoaded || isLoadingCharCreate) return;

        set({ isLoadingCharCreate: true, error: null });

        try {
          if (!WorldSocket.isConnected) {
            throw new Error("WorldSocket not connected");
          }

          const response = await WorldSocket.sendRequest(
            OpCodes.CharCreateDataRequest,
            OpCodes.CharCreateDataResponse,
            CharCreateDataRequest,
            CharCreateDataResponse,
            {}
          );

          if (!response.success) {
            throw new Error(response.error || "Failed to load character creation data");
          }

          // Parse char create combinations
          const charCreateCombinations: CharCreateCombinationData[] = [];
          for (let i = 0; i < response.charCreateCombinations.length; i++) {
            const c = response.charCreateCombinations.get(i);
            charCreateCombinations.push({
              allocationId: c.allocationId,
              race: c.race,
              class: c.class,
              deity: c.deity,
              startZone: c.startZone,
              expansionsReq: c.expansionsReq,
            });
          }

          // Parse char create point allocations
          const charCreatePointAllocations: CharCreatePointAllocationData[] = [];
          for (let i = 0; i < response.charCreatePointAllocations.length; i++) {
            const a = response.charCreatePointAllocations.get(i);
            charCreatePointAllocations.push({
              id: a.id,
              baseStr: a.baseStr,
              baseSta: a.baseSta,
              baseDex: a.baseDex,
              baseAgi: a.baseAgi,
              baseInt: a.baseInt,
              baseWis: a.baseWis,
              baseCha: a.baseCha,
              allocStr: a.allocStr,
              allocSta: a.allocSta,
              allocDex: a.allocDex,
              allocAgi: a.allocAgi,
              allocInt: a.allocInt,
              allocWis: a.allocWis,
              allocCha: a.allocCha,
            });
          }

          // Parse combination descriptions
          const combinationDescriptions: CombinationDescriptionData[] = [];
          if (response.combinationDescriptions) {
            for (let i = 0; i < response.combinationDescriptions.length; i++) {
              const d = response.combinationDescriptions.get(i);
              combinationDescriptions.push({
                raceId: d.raceId,
                classId: d.classId,
                deityId: d.deityId,
                description: d.description,
              });
            }
          }

          // Parse start zones
          const startZones: StartZoneData[] = [];
          if (response.startZones) {
            for (let i = 0; i < response.startZones.length; i++) {
              const sz = response.startZones.get(i);
              startZones.push({
                x: sz.x,
                y: sz.y,
                z: sz.z,
                heading: sz.heading,
                zoneIdNumber: sz.zoneIdNumber,
                playerClass: sz.playerClass,
                playerDeity: sz.playerDeity,
                playerRace: sz.playerRace,
              });
            }
          }

          // Parse zone descriptions
          const zoneDescriptions: ZoneDescriptionData[] = [];
          if (response.zoneDescriptions) {
            for (let i = 0; i < response.zoneDescriptions.length; i++) {
              const zd = response.zoneDescriptions.get(i);
              zoneDescriptions.push({
                zoneId: zd.zoneId,
                description: zd.description,
                welcome: zd.welcome,
              });
            }
          }

          set({
            isCharCreateLoaded: true,
            isLoadingCharCreate: false,
            charCreateCombinations,
            charCreatePointAllocations,
            combinationDescriptions,
            startZones,
            zoneDescriptions,
          });

          console.log(
            `[StaticData] Loaded CharCreate: ${charCreateCombinations.length} combinations, ${startZones.length} start zones`
          );
        } catch (error) {
          console.error("Failed to load character creation data:", error);
          set({
            isLoadingCharCreate: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },

      getRaceById: (id: number) => {
        return get().races.find((r) => r.id === id);
      },

      getClassById: (id: number) => {
        return get().classes.find((c) => c.id === id);
      },

      getDeityById: (id: number) => {
        return get().deities.find((d) => d.id === id);
      },

      getZoneByZoneIdNumber: (zoneidnumber: number) => {
        return get().zones.find((z) => z.zoneidnumber === zoneidnumber);
      },

      getCombinationDescription: (raceId: number, classId: number, deityId: number) => {
        return get().combinationDescriptions.find(
          (d) =>
            d.raceId === raceId &&
            d.classId === classId &&
            d.deityId === deityId
        )?.description;
      },

      getZoneDescription: (zoneId: number) => {
        return get().zoneDescriptions.find((d) => d.zoneId === zoneId);
      },
    }),
    { name: "Static Data Store" }
  )
);

export default useStaticDataStore;
