import { create } from "zustand";
import CharacterCreationAttributes from "../entities/CharacterCreationAttributes";
import Race from "../entities/Race";
import CharacterClass from "../entities/CharacterClass";
import Zone from "../entities/Zone";
import Deity from "../entities/Deity";
import races from "/data/races.json";
import classes from "/data/classes.json";
import charCreateCombinations from "/data/char_create_combinations.json";
import charCreatePointAllocations from "/data/char_create_point_allocations.json";
import charCreatePointsAvailable from "/data/char_create_points_available.json";

const humanRace = races.find((race: Race) => race.id === 1);
const warriorClass = classes.find(
  (charClass: CharacterClass) => charClass.id === 1
);
const baseAttributeKeys = ["str", "sta", "dex", "agi", "int", "wis", "cha"];

const getAttributePointsForClass = (classId: number): number => {
  const classPoints = charCreatePointsAvailable.find(
    (c) => c.class_id === classId
  );
  return classPoints ? classPoints.attribute_points : 0;
};

const calculateBaseAttributes = (
  race: Race | null,
  charClass: CharacterClass | null
) => {
  const baseAttributes = baseAttributeKeys.reduce((acc, attr) => {
    acc[`base_${attr}`] = 0;
    acc[attr] = 0;
    return acc;
  }, {} as CharacterCreationAttributes);

  if (race && charClass) {
    const combination = charCreateCombinations.find(
      (combo) => combo.race === race.id && combo.class === charClass.id
    );

    if (combination) {
      const allocationId = combination.allocation_id;
      const attributeSet = charCreatePointAllocations.find(
        (attr) => attr.id === allocationId
      );

      if (attributeSet) {
        baseAttributeKeys.forEach((attr) => {
          baseAttributes[`base_${attr}`] = attributeSet[`base_${attr}`] || 0;
        });
      }
    }
  }

  // Apply race and class modifiers
  if (race) {
    baseAttributeKeys.forEach((attr) => {
      if (attr in race) {
        baseAttributes[`base_${attr}`] += race[attr as keyof Race] as number;
      }
    });
  }

  if (charClass) {
    baseAttributeKeys.forEach((attr) => {
      if (attr in charClass) {
        baseAttributes[`base_${attr}`] += charClass[
          attr as keyof CharacterClass
        ] as number;
      }
    });
  }

  return baseAttributes;
};

interface CharacterCreatorStore {
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
}

const useCharacterCreatorStore = create<CharacterCreatorStore>((set, get) => ({
  selectedZone: null,
  selectedRace: humanRace || null,
  selectedClass: warriorClass || null,
  attributes: {
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
  },
  attributePoints: warriorClass
    ? getAttributePointsForClass(warriorClass.id)
    : 0,
  setSelectedRace: (race) =>
    set((state) => {
      const newState = { selectedRace: race };
      const baseAttributes = calculateBaseAttributes(race, state.selectedClass);
      return {
        ...newState,
        attributes: { ...state.attributes, ...baseAttributes },
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
      const baseAttributes = calculateBaseAttributes(
        state.selectedRace,
        charClass
      );
      return {
        ...newState,
        attributes: { ...state.attributes, ...baseAttributes },
      };
    }),
  setSelectedZone: (zone) => set({ selectedZone: zone }),
  setAttributes: (attributes) =>
    set((state) => {
      const totalAllocated =
        Object.values(attributes).reduce((sum, value) => sum + value, 0) -
        Object.values(state.attributes).reduce((sum, value) => sum + value, 0);
      return {
        attributes,
        attributePoints: state.attributePoints - totalAllocated,
      };
    }),
  setAttributePoints: (points) => set({ attributePoints: points }),
  updateBaseAttributes: () =>
    set((state) => {
      const baseAttributes = calculateBaseAttributes(
        state.selectedRace,
        state.selectedClass
      );
      return { attributes: { ...state.attributes, ...baseAttributes } };
    }),
  selectedDeity: null,
  setSelectedDeity: (deity) => set({ selectedDeity: deity }),
  setCharacterName: (name) => set({ characterName: name }),
  characterName: "",
}));

export default useCharacterCreatorStore;
