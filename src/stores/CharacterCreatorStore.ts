import { create } from "zustand";
import CharacterCreationAttributes from "../entities/CharacterCreationAttributes";
import Race from "../entities/Race";
import CharacterClass from "../entities/CharacterClass";
import Zone from "../entities/Zone";

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
}

const useCharacterCreatorStore = create<CharacterCreatorStore>((set) => ({
  selectedZone: null,
  selectedRace: null,
  selectedClass: null,
  attributes: {
    base_str: 5,
    base_sta: 0,
    base_dex: 0,
    base_agi: 0,
    base_int: 0,
    base_wis: 0,
    base_cha: 0,
    str: 1,
    sta: 0,
    dex: 0,
    agi: 0,
    int: 0,
    wis: 0,
    cha: 0,
  },
  attributePoints: 20,
  setSelectedRace: (race) => set({ selectedRace: race }),
  setSelectedClass: (charClass) => set({ selectedClass: charClass }),
  setSelectedZone: (zone) => set({ selectedZone: zone }),
  setAttributes: (attributes) => set((state) => {
    const totalAllocated = Object.values(attributes).reduce((sum, value) => sum + value, 0) -
      Object.values(state.attributes).reduce((sum, value) => sum + value, 0);
    return {
      attributes,
      attributePoints: state.attributePoints - totalAllocated
    };
  }),
  setAttributePoints: (points) => set({ attributePoints: points }),
}));

export default useCharacterCreatorStore;
