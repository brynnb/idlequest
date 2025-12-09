import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import GameEngine from "./scripts/GameEngine";
import useGameStatusStore from "./stores/GameStatusStore";
import usePlayerCharacterStore from "./stores/PlayerCharacterStore";

const App = () => {
  useEffect(() => {
    GameEngine.getInstance();
    // Subscribe to CHARACTER_STATE messages early so we don't miss them
    usePlayerCharacterStore.getState().initializeCharacterSync();
  }, []);

  return (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
};

const initializeStore = async () => {
  await useGameStatusStore.persist.rehydrate();

  createRoot(document.getElementById("root")!).render(<App />);
};

initializeStore();
