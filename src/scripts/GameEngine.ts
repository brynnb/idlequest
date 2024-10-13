import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import { NPCType } from "@entities/NPCType";
import { getNPCLoot } from "@utils/getNPCLoot";
import { handleLoot } from "@utils/itemUtils";

const gameStatusStore = useGameStatusStore;
const playerCharacterStore = usePlayerCharacterStore;

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

    if (!characterProfile.zoneId || currentZoneNPCs.length === 0) return;

    const randomIndex = Math.floor(Math.random() * currentZoneNPCs.length);
    const newTargetNPC = currentZoneNPCs[randomIndex];

    setTargetNPC(newTargetNPC);
  }

  private handleNPCDefeat(npcName: string) {
    const { targetNPC } = gameStatusStore.getState();

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
        this.fetchAndSetTargetNPC();
      });
  }

  private tick() {
    const { targetNPC, currentNPCHealth, quickMode, isRunning } =
      gameStatusStore.getState();

    if (!isRunning) {
      this.stopEngine();
      return;
    }

    if (!targetNPC || currentNPCHealth === null || currentNPCHealth <= 0) {
      this.fetchAndSetTargetNPC();
      return;
    }

    const damagePerTick = quickMode ? targetNPC.hp / 5 : targetNPC.hp / 15;
    const newHealth = Math.max(currentNPCHealth - damagePerTick, 0);
    gameStatusStore.setState({ currentNPCHealth: newHealth });

    if (newHealth === 0) {
      this.handleNPCDefeat(targetNPC.name);
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
