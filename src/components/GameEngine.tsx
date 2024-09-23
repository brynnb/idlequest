import React, { useState, useEffect, useRef } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import useGameStatusStore from "../stores/GameStatusStore";
import { NPCType } from "../entities/NPCType";

interface GameEngineProps {
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

const GameEngine: React.FC<GameEngineProps> = ({ isRunning, setIsRunning }) => {
  const [monster, setMonster] = useState<NPCType | null>(null);
  const [tick, setTick] = useState(0);
  const loggedRef = useRef(false);
  const { characterProfile } = usePlayerCharacterStore();
  const { 
    initializeZones, 
    getZoneLongNameById, 
    currentZoneNPCs, 
    setCurrentZone, 
    updateCurrentZoneNPCs 
  } = useGameStatusStore();

  useEffect(() => {
    initializeZones();
  }, [initializeZones]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prevTick) => prevTick + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAndSetMonster = async () => {
      if (!characterProfile.zoneId) return;

      await setCurrentZone(characterProfile.zoneId);
      await updateCurrentZoneNPCs();

      if (currentZoneNPCs.length === 0) return;

      const playerLevel = characterProfile.level || 1;
      const closestNPC = currentZoneNPCs.reduce((closest, npc) => {
        const currentDiff = Math.abs(npc.level - playerLevel);
        const closestDiff = Math.abs(closest.level - playerLevel);
        return currentDiff < closestDiff ? npc : closest;
      });

      setMonster(closestNPC);
    };

    fetchAndSetMonster();
  }, [characterProfile.zoneId, characterProfile.level, setCurrentZone, updateCurrentZoneNPCs, currentZoneNPCs]);

  useEffect(() => {
    if (!isRunning || !monster) return;

    if (tick % 15 === 0 && tick !== 0) {
      setMonster((prevMonster) => ({
        ...prevMonster!,
        hp: prevMonster!.hp,
      }));
      if (!loggedRef.current) {
        console.log("Monster attacked! Health reset to full.");
        loggedRef.current = true;
      }
    } else {
      setMonster((prevMonster) => {
        if (!prevMonster) return null;
        const newHealth = Math.max(prevMonster.hp - prevMonster.hp / 15, 0);
        if (!loggedRef.current) {
          console.log(`Monster health: ${newHealth.toFixed(2)}`);
          loggedRef.current = true;
        }
        return {
          ...prevMonster,
          hp: newHealth,
        };
      });
    }

    return () => {
      loggedRef.current = false;
    };
  }, [tick, isRunning, monster, setCurrentZone, updateCurrentZoneNPCs, currentZoneNPCs]);

  const toggleRunning = () => setIsRunning((prev) => !prev);

  const currentZoneName = characterProfile.zoneId
    ? getZoneLongNameById(characterProfile.zoneId) || "Unknown"
    : "Unknown";

  return (
    <div>
      <h2>Game Engine</h2>
      <div>Idle Game Running (check console for updates and controls)</div>
      <button onClick={toggleRunning}>
        {isRunning ? "Pause" : "Resume"}
      </button>
      {monster && (
        <div>
          <div>Monster: {monster.name}</div>
          <div>Level: {monster.level}</div>
          <div>Health: {monster.hp.toFixed(2)} / {monster.hp}</div>
        </div>
      )}
      <div>Current Zone: {currentZoneName}</div>
    </div>
  );
};

export default GameEngine;