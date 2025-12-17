import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import CharacterCreationAttributes from "@entities/CharacterCreationAttributes";
import Zone from "@entities/Zone";
import { InventoryItem } from "@entities/InventoryItem";
import {
  RaceData,
  ClassData,
  DeityData,
  CharCreatePointAllocationData,
} from "@stores/StaticDataStore";

const defaultAttributes: CharacterCreationAttributes = {
  base_str: 0,
  base_sta: 0,
  base_dex: 0,
  base_agi: 0,
  base_int: 0,
  base_wis: 0,
  base_cha: 0,
  str: 0,
  sta: 0,
  dex: 0,
  agi: 0,
  int: 0,
  wis: 0,
  cha: 0,
};

export interface CharacterCreatorStore {
  selectedRace: RaceData | null;
  selectedClass: ClassData | null;
  selectedZone: Zone | null;
  attributes: CharacterCreationAttributes;
  setSelectedRace: (race: RaceData | null) => void;
  setSelectedClass: (charClass: ClassData | null) => void;
  initializeDefaults: (
    races: RaceData[],
    classes: ClassData[],
    combinations: { race: number; class: number }[]
  ) => void;
  setSelectedZone: (zone: Zone | null) => void;
  setAttributes: (attributes: CharacterCreationAttributes) => void;
  setAttributePoints: (points: number) => void;
  attributePoints: number;
  updateBaseAttributes: (
    allocations: CharCreatePointAllocationData[],
    combinations: { race: number; class: number; allocationId: number }[]
  ) => void;
  selectedDeity: DeityData | null;
  setSelectedDeity: (deity: DeityData | null) => void;
  setCharacterName: (name: string) => void;
  characterName: string;
  allPointsAllocated: boolean;
  setAllPointsAllocated: (allocated: boolean) => void;
  resetStore: () => void;
  resetAttributes: () => void;
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  canProceedToNextStep: () => boolean;
}

const useCharacterCreatorStore = create<CharacterCreatorStore>()(
  devtools(
    persist(
      (set, get) => ({
        selectedZone: null,
        selectedRace: null,
        selectedClass: null,
        attributes: { ...defaultAttributes },
        attributePoints: 0,

        initializeDefaults: (
          races: RaceData[],
          classes: ClassData[],
          combinations: { race: number; class: number }[]
        ) => {
          // Get unique valid race/class combinations
          const validCombos: { race: number; class: number }[] = [];
          const seen = new Set<string>();
          for (const combo of combinations) {
            const key = `${combo.race}-${combo.class}`;
            if (!seen.has(key)) {
              seen.add(key);
              validCombos.push({ race: combo.race, class: combo.class });
            }
          }

          // Pick a random valid combination
          let selectedRace: RaceData | null = null;
          let selectedClass: ClassData | null = null;

          if (validCombos.length > 0) {
            const randomCombo =
              validCombos[Math.floor(Math.random() * validCombos.length)];
            selectedRace = races.find((r) => r.id === randomCombo.race) || null;
            selectedClass =
              classes.find((c) => c.id === randomCombo.class) || null;
          }

          // Fallback to human warrior if no valid combo found
          if (!selectedRace) {
            selectedRace = races.find((r) => r.id === 1) || races[0] || null;
          }
          if (!selectedClass) {
            selectedClass =
              classes.find((c) => c.id === 1) || classes[0] || null;
          }

          set({
            selectedRace,
            selectedClass,
            attributePoints: selectedClass?.createPoints || 0,
          });
        },

        setSelectedRace: (race) =>
          set((state) => ({
            selectedRace: race,
            attributePoints: state.selectedClass?.createPoints || 0,
          })),

        setSelectedClass: (charClass) =>
          set(() => ({
            selectedClass: charClass,
            attributePoints: charClass?.createPoints || 0,
          })),

        setSelectedZone: (zone) => set({ selectedZone: zone }),

        setAttributes: (attributes) =>
          set((state) => {
            const totalAllocated =
              Object.values(attributes).reduce((sum, value) => sum + value, 0) -
              Object.values(state.attributes).reduce(
                (sum, value) => sum + value,
                0
              );
            return {
              attributes,
              attributePoints: state.attributePoints - totalAllocated,
            };
          }),

        setAttributePoints: (points) => set({ attributePoints: points }),

        updateBaseAttributes: (
          allocations: CharCreatePointAllocationData[],
          combinations: { race: number; class: number; allocationId: number }[]
        ) =>
          set((state) => {
            if (!state.selectedRace || !state.selectedClass) {
              return { attributes: { ...defaultAttributes } };
            }
            const combo = combinations.find(
              (c) =>
                c.race === state.selectedRace?.id &&
                c.class === state.selectedClass?.id
            );
            if (!combo) {
              return { attributes: { ...defaultAttributes } };
            }
            const alloc = allocations.find((a) => a.id === combo.allocationId);
            if (!alloc) {
              return { attributes: { ...defaultAttributes } };
            }
            return {
              attributes: {
                base_str: alloc.baseStr,
                base_sta: alloc.baseSta,
                base_agi: alloc.baseAgi,
                base_dex: alloc.baseDex,
                base_wis: alloc.baseWis,
                base_int: alloc.baseInt,
                base_cha: alloc.baseCha,
                str: alloc.baseStr + alloc.allocStr,
                sta: alloc.baseSta + alloc.allocSta,
                agi: alloc.baseAgi + alloc.allocAgi,
                dex: alloc.baseDex + alloc.allocDex,
                wis: alloc.baseWis + alloc.allocWis,
                int: alloc.baseInt + alloc.allocInt,
                cha: alloc.baseCha + alloc.allocCha,
              },
            };
          }),

        selectedDeity: null,
        setSelectedDeity: (deity) => set({ selectedDeity: deity }),
        setCharacterName: (name) => set({ characterName: name }),
        characterName: "",
        allPointsAllocated: false,
        setAllPointsAllocated: (allocated) =>
          set({ allPointsAllocated: allocated }),

        resetStore: () => {
          set({
            selectedZone: null,
            selectedRace: null,
            selectedClass: null,
            attributes: { ...defaultAttributes },
            attributePoints: 0,
            selectedDeity: null,
            characterName: "",
            allPointsAllocated: false,
            inventory: [],
            currentStep: 1,
          });
        },

        resetAttributes: () =>
          set((state) => ({
            attributes: { ...defaultAttributes },
            attributePoints: state.selectedClass?.createPoints || 0,
          })),

        setInventory: (items) => set({ inventory: items }),
        inventory: [],
        currentStep: 1,
        setCurrentStep: (step) => set({ currentStep: step }),

        canProceedToNextStep: () => {
          const state = get();
          switch (state.currentStep) {
            case 1:
              return !!(
                state.characterName &&
                state.selectedRace &&
                state.selectedClass &&
                state.allPointsAllocated
              );
            case 2:
              return state.selectedDeity !== null;
            case 3:
              return state.selectedZone !== null;
            case 4:
              return true;
            default:
              return false;
          }
        },
      }),
      {
        name: "character-creator-storage",
      }
    ),
    { name: "Character Creator Store" }
  )
);

export default useCharacterCreatorStore;
