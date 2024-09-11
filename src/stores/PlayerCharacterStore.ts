import { create } from "zustand";
import CharacterCreationAttributes from "../entities/CharacterCreationAttributes";
import CharacterProfile from "../entities/CharacterProfile";

interface CharacterProfileStore {
  characterProfile: CharacterProfile;
  setName: (name: string) => void;
  setAttributes: (attributes: CharacterCreationAttributes) => void;
  incrementAttribute: (attr: keyof CharacterCreationAttributes) => void;
  decrementAttribute: (attr: keyof CharacterCreationAttributes) => void;
  // Add other methods as needed
}

const useCharacterProfileStore = create<CharacterProfileStore>((set) => ({
  characterProfile: {
    name: "",
    attributes: {
      str: 0,
      sta: 0,
      cha: 0,
      dex: 0,
      int: 0,
      agi: 0,
      wis: 0,
    },
  },
  setName: (name) =>
    set((state) => ({
      characterProfile: { ...state.characterProfile, name },
    })),
  setAttributes: (attributes) =>
    set((state) => ({
      characterProfile: { ...state.characterProfile, attributes },
    })),
  incrementAttribute: (attr) =>
    set((state) => ({
      characterProfile: {
        ...state.characterProfile,
        attributes: {
          ...state.characterProfile.attributes,
          [attr]: state.characterProfile.attributes[attr] + 1,
        },
      },
    })),
  decrementAttribute: (attr) =>
    set((state) => ({
      characterProfile: {
        ...state.characterProfile,
        attributes: {
          ...state.characterProfile.attributes,
          [attr]: Math.max(0, state.characterProfile.attributes[attr] - 1),
        },
      },
    })),
  // Add other methods as needed
}));

export default useCharacterProfileStore;
