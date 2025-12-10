import { create } from "zustand";

export interface CharacterSelectEntry {
  id: number;
  name: string;
  level: number;
  race: number;
  charClass: number;
  zone: number;
  gender: number;
  deity: number;
  face: number;
  lastLogin: number;
  enabled: number;
  items: unknown[];
}

interface CharacterSelectStore {
  characters: CharacterSelectEntry[];
  selectedCharacter: CharacterSelectEntry | null;
  isLoading: boolean;

  setCharacters: (characters: CharacterSelectEntry[]) => void;
  setSelectedCharacter: (character: CharacterSelectEntry | null) => void;
  setIsLoading: (loading: boolean) => void;
  removeCharacter: (characterName: string) => void;
  reset: () => void;
}

const useCharacterSelectStore = create<CharacterSelectStore>((set, get) => ({
  characters: [],
  selectedCharacter: null,
  isLoading: false,

  setCharacters: (characters) => {
    // Sort by lastLogin ascending (oldest first, newest at bottom)
    const sorted = [...characters].sort(
      (a, b) => (a.lastLogin || 0) - (b.lastLogin || 0)
    );
    set({
      characters: sorted,
      // Auto-select last character (most recently created/logged in)
      selectedCharacter: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    });
  },

  setSelectedCharacter: (character) => set({ selectedCharacter: character }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  removeCharacter: (characterName) => {
    const { characters, selectedCharacter } = get();
    const filtered = characters.filter((c) => c.name !== characterName);
    set({
      characters: filtered,
      // Clear selection if deleted character was selected
      selectedCharacter:
        selectedCharacter?.name === characterName
          ? filtered.length > 0
            ? filtered[filtered.length - 1]
            : null
          : selectedCharacter,
    });
  },

  reset: () =>
    set({
      characters: [],
      selectedCharacter: null,
      isLoading: false,
    }),
}));

export default useCharacterSelectStore;
