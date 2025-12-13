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
  pendingSelectName: string | null; // Name of character to auto-select after creation

  setCharacters: (characters: CharacterSelectEntry[]) => void;
  setSelectedCharacter: (character: CharacterSelectEntry | null) => void;
  setIsLoading: (loading: boolean) => void;
  removeCharacter: (characterName: string) => void;
  setPendingSelectName: (name: string | null) => void;
  reset: () => void;
}

const useCharacterSelectStore = create<CharacterSelectStore>((set, get) => ({
  characters: [],
  selectedCharacter: null,
  isLoading: false,
  pendingSelectName: null,

  setCharacters: (characters) => {
    const { pendingSelectName } = get();
    // Sort by lastLogin ascending (oldest first, newest at bottom)
    const sorted = [...characters].sort(
      (a, b) => (a.lastLogin || 0) - (b.lastLogin || 0)
    );

    // If we have a pending character name to select (from character creation), find and select it
    let selectedChar: CharacterSelectEntry | null = null;
    if (pendingSelectName) {
      selectedChar = sorted.find((c) => c.name === pendingSelectName) || null;
    }
    // Otherwise auto-select last character (most recently created/logged in)
    if (!selectedChar && sorted.length > 0) {
      selectedChar = sorted[sorted.length - 1];
    }

    set({
      characters: sorted,
      selectedCharacter: selectedChar,
      pendingSelectName: null, // Clear the pending name after use
    });
  },

  setPendingSelectName: (name) => set({ pendingSelectName: name }),

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
