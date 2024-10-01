import React, { useState, useEffect } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import useGameStatusStore from "../stores/GameStatusStore";
import { NPCType } from "../entities/NPCType";
import { getNPCLoot } from "../utils/getNPCLoot";
import { handleLoot } from "../utils/itemUtils";

interface GameEngineProps {
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

const GameEngine: React.FC<GameEngineProps> = ({ isRunning, setIsRunning }) => {
  const { characterProfile } = usePlayerCharacterStore((state) => ({
    characterProfile: state?.characterProfile,
  })) || { characterProfile: null };

  if (!characterProfile) {
    return <div>Loading character profile...</div>;
  }

  const [targetNPC, setTargetNPC] = useState<NPCType | null>(null);
  const [currentHealth, setCurrentHealth] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const { getZoneLongNameById, setCurrentZone, updateCurrentZoneNPCs } =
    useGameStatusStore();

  const { addInventoryItem, characterProfile: playerCharacterProfile } =
    usePlayerCharacterStore();

  const fetchAndSetTargetNPC = async () => {
    const { currentZoneNPCs } = useGameStatusStore.getState();
    if (!characterProfile.zoneId || currentZoneNPCs.length === 0) return;

    const playerLevel = characterProfile.level || 1;
    const eligibleNPCs = currentZoneNPCs.filter(
      (npc) =>
        Math.abs(npc.level - playerLevel) <= 3 && npc.id !== targetNPC?.id
    );

    if (eligibleNPCs.length === 0) return;

    const randomIndex = Math.floor(Math.random() * eligibleNPCs.length);
    const newTargetNPC = eligibleNPCs[randomIndex];

    setTargetNPC(newTargetNPC);
    setCurrentHealth(Number(newTargetNPC.hp) || 0);
  };

  const handleNPCDefeat = (npcName: string) => {
    if (!targetNPC || !targetNPC.id) {
      console.error("No target NPC or NPC ID when attempting to get loot");
      return;
    }

    const npcId = Number(targetNPC.id);

    if (isNaN(npcId)) {
      console.error(`Invalid NPC ID: ${targetNPC.id}`);
      return;
    }

    getNPCLoot(npcId)
      .then((loot) => {
        handleLoot(loot);
      })
      .catch((error) => {
        console.error("Error fetching NPC loot:", error);
      })
      .finally(() => {
        fetchAndSetTargetNPC();
      });
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
        setTick((prevTick) => prevTick + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !targetNPC || currentHealth === null) return;

    setCurrentHealth((prevHealth) => {
      if (prevHealth === null) return null;
      if (tick % 15 === 0 && tick !== 0) {
        return Number(targetNPC.hp) || 0;
      } else {
        const newHealth = Math.max(
          prevHealth - (Number(targetNPC.hp) || 0) / 15,
          0
        );
        if (newHealth === 0) {
          handleNPCDefeat(targetNPC.name);
        }
        return newHealth;
      }
    });
  }, [tick, isRunning, targetNPC, characterProfile.zoneId]);

  const toggleRunning = () => setIsRunning((prev) => !prev);

  const instantKillNPC = () => {
    if (targetNPC && currentHealth !== null) {
      setCurrentHealth(0);
      handleNPCDefeat(targetNPC.name);
    }
  };

  const currentZoneName = characterProfile.zoneId
    ? getZoneLongNameById(characterProfile.zoneId) || "Unknown"
    : "Unknown";

  return (
    <div>
      <h2>Game Engine</h2>
      <div>Idle Game Running</div>
      <button onClick={toggleRunning}>{isRunning ? "Pause" : "Resume"}</button>
      {targetNPC && currentHealth !== null && (
        <div>
          <div>Target NPC: {targetNPC.name}</div>
          <div>Level: {targetNPC.level}</div>
          <div>
            Health: {currentHealth.toFixed(2)} /{" "}
            {Number(targetNPC.hp).toFixed(2)}
          </div>
          <button onClick={instantKillNPC}>Instant Kill</button>
        </div>
      )}
      <div>Current Zone: {currentZoneName}</div>
    </div>
  );
};

export default GameEngine;
