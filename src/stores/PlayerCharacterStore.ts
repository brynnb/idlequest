import { create } from "zustand";
import { devtools } from "zustand/middleware";
import CharacterProfile from "../entities/CharacterProfile";

interface PlayerCharacterStore {
  characterProfile: CharacterProfile;
  setCharacterProfile: (profile: CharacterProfile) => void;
}

const usePlayerCharacterStore = create<PlayerCharacterStore>()(
  devtools(
    (set) => ({
      characterProfile: {
        name: "",
        race: null,
        class: null,
        deity: null,
        startingZone: null,
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
      setCharacterProfile: (profile) => set({ characterProfile: profile }),
    }),
    { name: "Player Character Store" }
  )
);

export default usePlayerCharacterStore;
