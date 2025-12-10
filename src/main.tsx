import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import GameEngine from "./scripts/GameEngine";
import useGameStatusStore from "./stores/GameStatusStore";
import usePlayerCharacterStore from "./stores/PlayerCharacterStore";
import { WorldSocket, OpCodes, JWTLogin, JWTResponse } from "./net";

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    GameEngine.getInstance();
    // Subscribe to CHARACTER_STATE messages early so we don't miss them
    usePlayerCharacterStore.getState().initializeCharacterSync();

    // Connect to the WorldSocket (Cap'n Proto WebTransport)
    const connectWorldSocket = async () => {
      try {
        const connected = await WorldSocket.connect("127.0.0.1", 443, () => {
          console.log("WorldSocket disconnected");
          setIsConnected(false);
          setIsAuthenticated(false);
        });
        if (connected) {
          console.log("WorldSocket connected");
          setIsConnected(true);

          // Register handler for JWT response
          WorldSocket.registerOpCodeHandler(
            OpCodes.JWTResponse,
            JWTResponse,
            (response) => {
              console.log("JWT Response:", response.status);
              if (response.status > 0) {
                console.log("Authenticated successfully");
                setIsAuthenticated(true);
              } else {
                console.error("Authentication failed");
              }
            }
          );

          // Send JWT login (use "local" token for local development)
          await WorldSocket.sendMessage(OpCodes.JWTLogin, JWTLogin, {
            token: "local",
          });
          console.log("Sent JWTLogin");
        }
      } catch (error) {
        console.error("Failed to connect WorldSocket:", error);
      }
    };

    connectWorldSocket();
  }, []);

  if (!isConnected) {
    return <div style={{ padding: 20 }}>Connecting to server...</div>;
  }

  if (!isAuthenticated) {
    return <div style={{ padding: 20 }}>Authenticating...</div>;
  }

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
