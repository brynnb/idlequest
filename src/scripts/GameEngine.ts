import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useChatStore, { MessageType } from "@stores/ChatStore";
import { NPCType } from "@entities/NPCType";
import { getNPCLoot } from "@utils/getNPCLoot";
import { useInventoryActions } from "@hooks/useInventoryActions";
import { createInventorySelling } from "@hooks/useInventorySelling";

const gameStatusStore = useGameStatusStore;
const playerCharacterStore = usePlayerCharacterStore;
const chatStore = useChatStore;

class GameEngine {
  private static instance: GameEngine;
  private tickInterval: number | null = null;

  private constructor() {
    this.initialize();
    this.setupRunningListener();
  }

  public static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }

  private initialize() {
    console.log("Initializing GameEngine");
    const { characterProfile } = playerCharacterStore.getState();
    const { setCurrentZone, updateCurrentZoneNPCs, isRunning } =
      gameStatusStore.getState();

    if (characterProfile.zoneId) {
      setCurrentZone(characterProfile.zoneId);
      updateCurrentZoneNPCs();
      this.fetchAndSetTargetNPC();
    }

    if (isRunning) {
      this.startEngine();
    }
  }

  private setupRunningListener() {
    gameStatusStore.subscribe(
      (state) => state.isRunning,
      (isRunning) => {
        if (isRunning) {
          this.startEngine();
        } else {
          this.stopEngine();
        }
      }
    );
  }

  private async fetchAndSetTargetNPC() {
    console.log("Fetching and setting target NPC");
    const { currentZoneNPCs, setTargetNPC } = gameStatusStore.getState();
    const { characterProfile } = playerCharacterStore.getState();
    const { addMessage } = chatStore.getState();

    if (!characterProfile.zoneId || currentZoneNPCs.length === 0) return;

    const playerLevel = characterProfile.level || 1;
    const levelRange = 99; //adjust as needed

    const eligibleNPCs = currentZoneNPCs.filter((npc) => {
      const npcLevel = npc.level || 1;
      return Math.abs(npcLevel - playerLevel) <= levelRange;
    });

    if (eligibleNPCs.length === 0) {
      console.log("No NPCs within the acceptable level range");
      addMessage(
        "No suitable NPCs found in this zone. Try moving to a different area!",
        MessageType.SYSTEM
      );
      return;
    }

    const randomIndex = Math.floor(Math.random() * eligibleNPCs.length);
    const newTargetNPC = eligibleNPCs[randomIndex];

    setTargetNPC(newTargetNPC);
  }

  private getExperienceForNPCKill(npcId: number): number {
    const { targetNPC } = gameStatusStore.getState();

    const level = targetNPC.level;
    const EXP_FORMULA = (level: number) =>
      Math.floor((level * level * 75 * 35) / 10); //from https://github.com/EQEmu/Server/blob/ae198ae04332e4f7176114de9cfab893b720af24/common/features.h#L223

    return EXP_FORMULA(level);
  }

  private handleNPCDefeat(npcName: string) {
    const { targetNPC } = gameStatusStore.getState();
    const { addMessage } = chatStore.getState();
    const { handleLoot } = useInventoryActions();
    const { sellGeneralInventory } = createInventorySelling();

    if (!targetNPC || !targetNPC.id) {
      console.error("No target NPC or NPC ID when attempting to get loot");
      return;
    }

    const npcId = Number(targetNPC.id);

    const { characterProfile } = playerCharacterStore.getState();
    const oldLevel = characterProfile.level;
    const experienceGained = this.getExperienceForNPCKill();
    console.log("Experience gained:", experienceGained);
    playerCharacterStore.getState().addExperience(experienceGained);
    console.log("Experience after addition:", characterProfile.exp);
    console.log("Level after addition:", characterProfile.level);

    if (characterProfile.level > oldLevel) {
      addMessage(
        `Congratulations! You have reached level ${characterProfile.level}!`,
        MessageType.EXPERIENCE_GAIN
      );
    }

    addMessage(
      `You have defeated ${npcName} and gained ${experienceGained} experience!`,
      MessageType.COMBAT_OUTGOING
    );

    getNPCLoot(npcId)
      .then((loot) => {
        handleLoot(loot);
      })
      .catch((error) => {
        console.error("Error fetching NPC loot:", error);
      })
      .finally(() => {
        this.fetchAndSetTargetNPC();
      });
  }

  private tick() {
    const { targetNPC, currentNPCHealth, quickMode, isRunning } =
      gameStatusStore.getState();
    const { characterProfile } = playerCharacterStore.getState();

    if (!isRunning) {
      this.stopEngine();
      return;
    }

    let isRegenerating = false;

    // Regenerate health and mana
    if (
      characterProfile.curHp < characterProfile.maxHp ||
      characterProfile.curMana < characterProfile.maxMana
    ) {
      isRegenerating = true;

      const regenRate = 0.1;
      const healthRegen = Math.floor(characterProfile.maxHp * regenRate);
      const manaRegen = Math.floor(characterProfile.maxMana * regenRate);

      const newHealth = Math.min(
        characterProfile.curHp + healthRegen,
        characterProfile.maxHp
      );
      const newMana = Math.min(
        characterProfile.curMana + manaRegen,
        characterProfile.maxMana
      );

      playerCharacterStore.getState().updateHealthAndMana(newHealth, newMana);
    }

    if (!targetNPC || currentNPCHealth === null || currentNPCHealth <= 0) {
      this.fetchAndSetTargetNPC();
      return;
    }

    // Only attack and damage NPC if not regenerating
    if (!isRegenerating) {
      const damagePerTick = quickMode ? targetNPC.hp / 5 : targetNPC.hp / 15;
      const newHealth = Math.max(currentNPCHealth - damagePerTick, 0);
      gameStatusStore.setState({ currentNPCHealth: newHealth });

      if (newHealth === 0) {
        this.handleNPCDefeat(targetNPC.name);
      }
    }
  }

  private startEngine() {
    if (!this.tickInterval) {
      this.tickInterval = window.setInterval(() => this.tick(), 1000);
    }
  }

  private stopEngine() {
    if (this.tickInterval) {
      window.clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  public toggleRunning() {
    const { isRunning, setIsRunning } = gameStatusStore.getState();
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);
    if (newIsRunning) {
      this.startEngine();
    } else {
      this.stopEngine();
    }
  }

  public instantKillNPC() {
    const { targetNPC } = gameStatusStore.getState();
    if (targetNPC) {
      gameStatusStore.setState({ currentNPCHealth: 0 });
      this.handleNPCDefeat(targetNPC.name);
    }
  }
}

export default GameEngine;
