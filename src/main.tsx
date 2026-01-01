import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Layout from "./pages/Layout";
import GameEngine from "./scripts/GameEngine";
import useGameStatusStore from "./stores/GameStatusStore";
import usePlayerCharacterStore from "./stores/PlayerCharacterStore";

const App = () => {
  useEffect(() => {
    // Initialize game engine
    GameEngine.getInstance();
    // Initialize character sync to receive SendCharInfo messages
    usePlayerCharacterStore.getState().initializeCharacterSync();
  }, []);

  return (
    <StrictMode>
      <Layout />
    </StrictMode>
  );
};

const initializeStore = async () => {
  await useGameStatusStore.persist.rehydrate();

  createRoot(document.getElementById("root")!).render(<App />);
};

initializeStore();
