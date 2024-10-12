import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import GameEngine from "./scripts/GameEngine";
import useGameStatusStore from "./stores/GameStatusStore";

const App = () => {
  useEffect(() => {
    GameEngine.getInstance();
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
