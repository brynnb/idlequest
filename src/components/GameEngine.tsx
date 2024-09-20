import React, { useState, useEffect, useRef } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import { zoneCache } from "../utils/zoneCache";

interface Monster {
  health: number;
  maxHealth: number;
}

interface GameEngineProps {
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

const GameEngine: React.FC<GameEngineProps> = ({ isRunning, setIsRunning }) => {
  const [monster, setMonster] = useState<Monster>({
    health: 100,
    maxHealth: 100,
  });
  const [tick, setTick] = useState(0);
  const loggedRef = useRef(false);
  const { characterProfile } = usePlayerCharacterStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prevTick) => prevTick + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isRunning) return; // Exit early if the game is paused

    if (tick % 15 === 0 && tick !== 0) {
      setMonster((prevMonster) => ({
        ...prevMonster,
        health: prevMonster.maxHealth,
      }));
      if (!loggedRef.current) {
        console.log("Monster attacked! Health reset to full.");
        loggedRef.current = true;
      }
    } else {
      setMonster((prevMonster) => {
        const newHealth = Math.max(
          prevMonster.health - prevMonster.maxHealth / 15,
          0
        );
        if (!loggedRef.current) {
          console.log(`Monster health: ${newHealth.toFixed(2)}`);
          loggedRef.current = true;
        }
        return {
          ...prevMonster,
          health: newHealth,
        };
      });
    }

    return () => {
      loggedRef.current = false;
    };
  }, [tick, isRunning]);

  const toggleRunning = () => setIsRunning((prev) => !prev);

  const currentZoneName = characterProfile.zoneId
    ? zoneCache.getLongNameById(characterProfile.zoneId) || "Unknown"
    : "Unknown";

  return (
    <div>
      <h2>Game Engine</h2>
      <div>Idle Game Running (check console for updates and controls)</div>
      <button onClick={toggleRunning}>
        {isRunning ? "Pause" : "Resume"}
      </button>
      <div>Monster Health: {monster.health.toFixed(2)} / {monster.maxHealth}</div>
      <div>Current Zone: {currentZoneName}</div>
    </div>
  );
};

export default GameEngine;