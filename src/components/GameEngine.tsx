import React, { useState, useEffect } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import useGameStatusStore from "../stores/GameStatusStore";
import { NPCType } from "../entities/NPCType";
import { getNPCLoot } from "../utils/getNPCLoot";

interface GameEngineProps {
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

const GameEngine: React.FC<GameEngineProps> = ({ isRunning, setIsRunning }) => {
  const [targetNPC, setTargetNPC] = useState<NPCType | null>(null);
  const [currentHealth, setCurrentHealth] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const { characterProfile } = usePlayerCharacterStore();
  const { 
    getZoneLongNameById, 
    setCurrentZone, 
    updateCurrentZoneNPCs 
  } = useGameStatusStore();

  const fetchAndSetTargetNPC = async () => {
    const { currentZoneNPCs } = useGameStatusStore.getState();
    if (!characterProfile.zoneId || currentZoneNPCs.length === 0) return;

    const playerLevel = characterProfile.level || 1;
    const eligibleNPCs = currentZoneNPCs.filter(npc => 
      Math.abs(npc.level - playerLevel) <= 3 && npc.id !== targetNPC?.id
    );

    if (eligibleNPCs.length === 0) return;

    const randomIndex = Math.floor(Math.random() * eligibleNPCs.length);
    const newTargetNPC = eligibleNPCs[randomIndex];

    setTargetNPC(newTargetNPC);
    setCurrentHealth(Number(newTargetNPC.hp) || 0);
  };

  useEffect(() => {
    if (characterProfile.zoneId) {
      setCurrentZone(characterProfile.zoneId);
      updateCurrentZoneNPCs();
    }
  }, [characterProfile.zoneId, setCurrentZone, updateCurrentZoneNPCs]);

  useEffect(() => {
    if (!targetNPC || currentHealth === null || currentHealth <= 0) {
      fetchAndSetTargetNPC();
    }
  }, [targetNPC, currentHealth]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTick(prevTick => prevTick + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !targetNPC || currentHealth === null) return;

    setCurrentHealth(prevHealth => {
      if (prevHealth === null) return null;
      if (tick % 15 === 0 && tick !== 0) {
        return Number(targetNPC.hp) || 0;
      } else {
        const newHealth = Math.max(prevHealth - (Number(targetNPC.hp) || 0) / 15, 0);
        if (newHealth === 0) {
          // NPC defeated, fetch and log loot
          getNPCLoot(characterProfile.zoneId!)
            .then(loot => {
              console.log("NPC Defeated! Loot:", loot);
            })
            .catch(error => {
              console.error("Error fetching NPC loot:", error);
            });
        }
        return newHealth;
      }
    });
  }, [tick, isRunning, targetNPC, characterProfile.zoneId]);

  const toggleRunning = () => setIsRunning(prev => !prev);

  const currentZoneName = characterProfile.zoneId
    ? getZoneLongNameById(characterProfile.zoneId) || "Unknown"
    : "Unknown";

  return (
    <div>
      <h2>Game Engine</h2>
      <div>Idle Game Running</div>
      <button onClick={toggleRunning}>
        {isRunning ? "Pause" : "Resume"}
      </button>
      {targetNPC && currentHealth !== null && (
        <div>
          <div>Target NPC: {targetNPC.name}</div>
          <div>Level: {targetNPC.level}</div>
          <div>Health: {currentHealth.toFixed(2)} / {Number(targetNPC.hp).toFixed(2)}</div>
        </div>
      )}
      <div>Current Zone: {currentZoneName}</div>
    </div>
  );
};

export default GameEngine;