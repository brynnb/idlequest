import { create } from "zustand";

export type GameScreen =
  | "login"
  | "characterSelect"
  | "characterCreate"
  | "game";

interface GameScreenStore {
  currentScreen: GameScreen;
  setScreen: (screen: GameScreen) => void;
}

const useGameScreenStore = create<GameScreenStore>((set) => ({
  currentScreen: "login",
  setScreen: (screen) => set({ currentScreen: screen }),
}));

export default useGameScreenStore;
