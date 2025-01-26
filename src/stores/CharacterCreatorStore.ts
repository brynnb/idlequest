import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import CharacterCreationAttributes from "@entities/CharacterCreationAttributes";
import Race from "@entities/Race";
import CharacterClass from "@entities/CharacterClass";
import Zone from "@entities/Zone";
import Deity from "@entities/Deity";
import { InventoryItem } from "@entities/InventoryItem";
import races from "/data/races.json";
import classes from "/data/classes.json";
import charCreatePointsAvailable from "/data/char_create_points_available.json";
import getBaseAttributes from "@utils/getBaseAttributes";

const humanRace = races.find((race: Race) => race.id === 1);
const warriorClass = classes.find(
  (charClass: CharacterClass) => charClass.id === 1
);

const getAttributePointsForClass = (classId: number): number => {
  const classPoints = charCreatePointsAvailable.find(
    (c) => c.class_id === classId
  );
  return classPoints ? classPoints.attribute_points : 0;
};

export interface CharacterCreatorStore {
  selectedRace: Race | null;
  selectedClass: CharacterClass | null;
  selectedZone: Zone | null;
  attributes: CharacterCreationAttributes;
  setSelectedRace: (race: Race | null) => void;
  setSelectedClass: (charClass: CharacterClass | null) => void;
  setSelectedZone: (zone: Zone | null) => void;
  setAttributes: (attributes: CharacterCreationAttributes) => void;
  setAttributePoints: (points: number) => void;
  attributePoints: number;
  updateBaseAttributes: () => void;
  selectedDeity: Deity | null;
  setSelectedDeity: (deity: Deity | null) => void;
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
        selectedRace: humanRace || null,
        selectedClass: warriorClass || null,
        attributes: getBaseAttributes(humanRace, warriorClass),
        attributePoints: warriorClass
          ? getAttributePointsForClass(warriorClass.id)
          : 0,
        setSelectedRace: (race) =>
          set((state) => {
            const newState = { selectedRace: race };
            const baseAttributes = getBaseAttributes(race, state.selectedClass);
            return {
              ...newState,
              attributes: { ...baseAttributes },
              attributePoints: state.selectedClass
                ? getAttributePointsForClass(state.selectedClass.id)
                : 0,
            };
          }),
        setSelectedClass: (charClass) =>
          set((state) => {
            const newState = {
              selectedClass: charClass,
              attributePoints: charClass
                ? getAttributePointsForClass(charClass.id)
                : 0,
            };
            const baseAttributes = getBaseAttributes(
              state.selectedRace,
              charClass
            );
            return {
              ...newState,
              attributes: { ...baseAttributes },
            };
          }),
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
        updateBaseAttributes: () =>
          set((state) => {
            const baseAttributes = getBaseAttributes(
              state.selectedRace,
              state.selectedClass
            );
            return { attributes: { ...state.attributes, ...baseAttributes } };
          }),
        selectedDeity: null,
        setSelectedDeity: (deity) => set({ selectedDeity: deity }),
        setCharacterName: (name) => set({ characterName: name }),
        characterName: "",
        allPointsAllocated: false,
        setAllPointsAllocated: (allocated) =>
          set({ allPointsAllocated: allocated }),
        resetStore: () => {
          const defaultRace = humanRace || null;
          const defaultClass = warriorClass || null;
          const defaultAttributes = getBaseAttributes(
            defaultRace,
            defaultClass
          );

          set({
            selectedZone: null,
            selectedRace: defaultRace,
            selectedClass: defaultClass,
            attributes: defaultAttributes,
            attributePoints: defaultClass
              ? getAttributePointsForClass(defaultClass.id)
              : 0,
            selectedDeity: null,
            characterName: "",
            allPointsAllocated: false,
            inventory: [],
            currentStep: 1,
          });

          // Call updateBaseAttributes after resetting
          get().updateBaseAttributes();
        },
        resetAttributes: () =>
          set((state) => {
            const baseAttributes = getBaseAttributes(
              state.selectedRace,
              state.selectedClass
            );
            return {
              attributes: { ...baseAttributes },
              attributePoints: state.selectedClass
                ? getAttributePointsForClass(state.selectedClass.id)
                : 0,
            };
          }),
        setInventory: (items) => set({ inventory: items }),
        inventory: [],
        currentStep: 1,
        setCurrentStep: (step) => set({ currentStep: step }),
        canProceedToNextStep: () => {
          const state = get();
          switch (state.currentStep) {
            case 1:
              return (
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
