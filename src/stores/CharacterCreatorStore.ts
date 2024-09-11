import { create } from "zustand";
import CharacterCreationAttributes from "../entities/CharacterCreationAttributes";
import Race from "../entities/Race";
import CharacterClass from "../entities/CharacterClass";

interface CharacterCreatorStore {
  selectedRace: Race | null;
  selectedClass: CharacterClass | null;
  attributes: CharacterCreationAttributes;
  setSelectedRace: (race: Race | null) => void;
  setSelectedClass: (charClass: CharacterClass | null) => void;
  setAttributes: (attributes: CharacterCreationAttributes) => void;
}

const useCharacterCreatorStore = create<CharacterCreatorStore>((set) => ({
  selectedRace: null,
  selectedClass: null,
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
  setSelectedRace: (race) => set({ selectedRace: race }),
  setSelectedClass: (charClass) => set({ selectedClass: charClass }),
  setAttributes: (attributes) => set({ attributes }),
}));

export default useCharacterCreatorStore;
