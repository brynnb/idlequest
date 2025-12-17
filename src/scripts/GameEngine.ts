import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useChatStore, { MessageType } from "@stores/ChatStore";
import { WorldSocket } from "../net";
import {
  combatService,
  CombatNPCData,
  CombatRoundData,
  CombatEndData,
  LootData,
} from "@/services/combatService";
import { NPCType } from "@entities/NPCType";

const gameStatusStore = useGameStatusStore;
const playerCharacterStore = usePlayerCharacterStore;
const chatStore = useChatStore;

class GameEngine {
  private static instance: GameEngine;
  private combatActive = false;
  private regenInterval: ReturnType<typeof setInterval> | null = null;
  private waitingForRegenMessageShown = false;
  private static readonly REGEN_TICK_MS = 600; // Regen every 0.6 seconds (10x faster)
  private static readonly REGEN_PERCENT = 0.05; // 5% of max HP per tick

  private constructor() {
    this.initialize();
    this.setupRunningListener();
    this.setupCombatHandlers();
    this.startRegeneration();
  }

  public static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }

  private initialize() {
    const { characterProfile } = playerCharacterStore.getState();

    // Reset combat state on login - combat should always start stopped
    gameStatusStore.getState().setIsRunning(false);
    gameStatusStore.setState({ targetNPC: null, currentNPCHealth: null });
    this.combatActive = false;

    // Set zone ID directly without triggering NPC fetch
    if (characterProfile.zoneId) {
      gameStatusStore.setState({ currentZone: characterProfile.zoneId });
      // Only fetch zone data if WebTransport is connected
      if (WorldSocket.isConnected) {
        this.loadZoneData();
      }
    }
  }

  private setupCombatHandlers() {
    combatService.registerHandlers(
      this.onCombatStarted.bind(this),
      this.onCombatRound.bind(this),
      this.onCombatEnded.bind(this),
      this.onLootGenerated.bind(this)
    );
  }

  private onCombatStarted(npc: CombatNPCData | null, error?: string) {
    const { addMessage } = chatStore.getState();

    if (!npc) {
      addMessage(
        error || "Failed to start combat - no suitable NPCs found.",
        MessageType.SYSTEM
      );
      this.combatActive = false;
      return;
    }

    this.combatActive = true;

    // Set target NPC in game status store
    gameStatusStore.setState({
      targetNPC: {
        id: npc.id,
        name: npc.name,
        level: npc.level,
        hp: npc.maxHp,
        AC: npc.ac,
        mindmg: npc.minDmg,
        maxdmg: npc.maxDmg,
        attack_delay: npc.attackDelay,
      } as NPCType,
      currentNPCHealth: npc.hp,
    });

    addMessage(
      `You engage ${npc.name} in combat!`,
      MessageType.COMBAT_OUTGOING
    );
  }

  private onCombatRound(round: CombatRoundData) {
    const { targetNPC } = gameStatusStore.getState();
    const { addMessage } = chatStore.getState();

    // Update NPC health
    gameStatusStore.setState({ currentNPCHealth: round.npcHp });

    // Update player health
    playerCharacterStore
      .getState()
      .updateHealthAndMana(round.playerHp, round.playerHp);

    // Combat messages
    if (round.playerHit) {
      const critMsg = round.playerCritical ? " **CRITICAL**" : "";
      addMessage(
        `You hit ${targetNPC?.name || "the enemy"} for ${
          round.playerDamage
        } damage!${critMsg}`,
        MessageType.COMBAT_OUTGOING
      );
    } else {
      addMessage(
        `You miss ${targetNPC?.name || "the enemy"}!`,
        MessageType.COMBAT_OUTGOING
      );
    }

    if (round.npcHit) {
      addMessage(
        `${targetNPC?.name || "The enemy"} hits you for ${
          round.npcDamage
        } damage!`,
        MessageType.COMBAT_INCOMING
      );
    } else {
      addMessage(
        `${targetNPC?.name || "The enemy"} misses you!`,
        MessageType.COMBAT_INCOMING
      );
    }
  }

  private onCombatEnded(result: CombatEndData) {
    const { addMessage } = chatStore.getState();
    const { isRunning } = gameStatusStore.getState();

    this.combatActive = false;

    // Update player health
    playerCharacterStore
      .getState()
      .updateHealthAndMana(result.playerHp, result.playerMaxHp);

    if (result.victory) {
      addMessage(
        `You have defeated ${result.npcName} and gained ${result.expGained} experience!`,
        MessageType.EXPERIENCE_GAIN
      );

      // Add experience to character (level-up message is handled by addExperience)
      playerCharacterStore.getState().addExperience(result.expGained);

      // Clear target NPC
      gameStatusStore.setState({ targetNPC: null, currentNPCHealth: null });

      // Start next combat if still running
      if (isRunning) {
        setTimeout(() => this.startCombat(), 1000);
      }
    } else {
      // Player died
      addMessage(
        `You have been defeated by ${result.npcName}!`,
        MessageType.COMBAT_INCOMING
      );

      // Stop combat and clear target
      gameStatusStore.getState().setIsRunning(false);
      gameStatusStore.setState({ targetNPC: null, currentNPCHealth: null });

      // Restore to full health after death (server also does this)
      playerCharacterStore
        .getState()
        .updateHealthAndMana(result.playerMaxHp, result.playerMaxHp);

      // Respawn to bind zone if different from current zone
      const { characterProfile } = playerCharacterStore.getState();
      if (result.bindZoneId && result.bindZoneId !== characterProfile.zoneId) {
        addMessage(
          `You are being returned to your bind point.`,
          MessageType.SYSTEM
        );
        // Trigger zone change to bind point
        playerCharacterStore.getState().setCharacterZone(result.bindZoneId);
      }
    }
  }

  private onLootGenerated(loot: LootData) {
    const { addMessage } = chatStore.getState();

    // Report money
    const moneyParts: string[] = [];
    if (loot.platinum > 0) moneyParts.push(`${loot.platinum} platinum`);
    if (loot.gold > 0) moneyParts.push(`${loot.gold} gold`);
    if (loot.silver > 0) moneyParts.push(`${loot.silver} silver`);
    if (loot.copper > 0) moneyParts.push(`${loot.copper} copper`);

    if (moneyParts.length > 0) {
      addMessage(`You loot ${moneyParts.join(", ")}!`, MessageType.LOOT);
    }

    // Report items
    for (const item of loot.items) {
      addMessage(`You loot ${item.name}!`, MessageType.LOOT);
    }

    // TODO: Add items to inventory via server push or client request
  }

  // Public method to load zone data - can be called after connection is established
  public loadZoneData() {
    const { updateCurrentZoneNPCs } = gameStatusStore.getState();
    updateCurrentZoneNPCs();
  }

  private setupRunningListener() {
    gameStatusStore.subscribe(
      (state) => state.isRunning,
      (isRunning) => {
        if (isRunning) {
          this.startCombat();
        } else {
          this.stopCombat();
        }
      }
    );
  }

  private startCombat() {
    if (this.combatActive) {
      return;
    }

    // Wait for full health before starting combat
    if (!this.isAtFullHealth()) {
      // Only show the message once
      if (!this.waitingForRegenMessageShown) {
        console.log("Waiting to regenerate to full health before engaging...");
        this.waitingForRegenMessageShown = true;
      }
      // Check again in 1 second
      setTimeout(() => {
        const { isRunning } = gameStatusStore.getState();
        if (isRunning && !this.combatActive) {
          this.startCombat();
        }
      }, 1000);
      return;
    }

    // Reset the flag when we actually start combat
    this.waitingForRegenMessageShown = false;
    combatService.startCombat();
  }

  private stopCombat() {
    if (this.combatActive) {
      combatService.stopCombat();
      this.combatActive = false;
    }
  }

  public toggleRunning() {
    const { isRunning, setIsRunning } = gameStatusStore.getState();
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);
    if (newIsRunning) {
      this.startCombat();
    } else {
      this.stopCombat();
    }
  }

  public instantKillNPC() {
    // This is now a no-op since combat is server-side
    // The server handles all combat logic
    console.log("Combat is now server-controlled.");
  }

  private startRegeneration() {
    // Clear any existing interval
    if (this.regenInterval) {
      clearInterval(this.regenInterval);
    }

    this.regenInterval = setInterval(() => {
      // Only regenerate when not in combat
      if (this.combatActive) {
        return;
      }

      const { characterProfile, updateHealthAndMana } =
        playerCharacterStore.getState();
      if (!characterProfile) return;

      const currentHp = characterProfile.curHp || 0;
      const maxHp = characterProfile.maxHp || 1;
      const currentMana = characterProfile.mana || 0;
      const maxMana = characterProfile.maxMana || 0;

      // Check if already at full health and mana
      const atFullHp = currentHp >= maxHp;
      const atFullMana = maxMana <= 0 || currentMana >= maxMana;

      if (atFullHp && atFullMana) {
        return;
      }

      // Regenerate 5% of max HP/Mana per tick
      const hpRegenAmount = Math.ceil(maxHp * GameEngine.REGEN_PERCENT);
      const newHp = atFullHp
        ? currentHp
        : Math.min(currentHp + hpRegenAmount, maxHp);

      let newMana = currentMana;
      if (maxMana > 0 && !atFullMana) {
        const manaRegenAmount = Math.ceil(maxMana * GameEngine.REGEN_PERCENT);
        newMana = Math.min(currentMana + manaRegenAmount, maxMana);
      }

      updateHealthAndMana(newHp, newMana);
    }, GameEngine.REGEN_TICK_MS);
  }

  private isAtFullHealth(): boolean {
    const { characterProfile } = playerCharacterStore.getState();
    if (!characterProfile) return true;
    const currentHp = characterProfile.curHp || 0;
    const maxHp = characterProfile.maxHp || 1;
    return currentHp >= maxHp;
  }
}

export default GameEngine;
