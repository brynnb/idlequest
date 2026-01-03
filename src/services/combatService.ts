import { WorldSocket } from "@/net";
import { OpCodes } from "@/net/opcodes";
import {
  StartCombatRequest,
  StopCombatRequest,
  CombatStartedResponse,
  CombatRoundUpdate,
  CombatEndedResponse,
  LootGeneratedResponse,
} from "@/net/capnp/common";

export interface CombatNPCData {
  id: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  minDmg: number;
  maxDmg: number;
  attackDelay: number;
}

export interface CombatRoundData {
  playerHit: boolean;
  playerDamage: number;
  playerCritical: boolean;
  npcHit: boolean;
  npcDamage: number;
  playerHp: number;
  playerMaxHp: number;
  npcHp: number;
  npcMaxHp: number;
  roundNumber: number;
  npcDied: boolean; // NPC died this round, don't show NPC attack message
}

export interface CombatEndData {
  victory: boolean;
  npcName: string;
  expGained: number;
  playerHp: number;
  playerMaxHp: number;
  // Bind zone info for death respawn
  bindZoneId: number;
  bindX: number;
  bindY: number;
  bindZ: number;
  bindHeading: number;
}

export interface LootData {
  items: Array<{
    itemId: number;
    name: string;
    slot: number;
    bagSlot: number;
    charges: number;
    icon: number;
  }>;
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
}

type CombatStartedCallback = (
  npc: CombatNPCData | null,
  error?: string
) => void;
type CombatRoundCallback = (round: CombatRoundData) => void;
type CombatEndedCallback = (result: CombatEndData) => void;
type LootGeneratedCallback = (loot: LootData) => void;

class CombatService {
  private onCombatStarted: CombatStartedCallback | null = null;
  private onCombatRound: CombatRoundCallback | null = null;
  private onCombatEnded: CombatEndedCallback | null = null;
  private onLootGenerated: LootGeneratedCallback | null = null;
  private registered = false;

  public registerHandlers(
    onStarted: CombatStartedCallback,
    onRound: CombatRoundCallback,
    onEnded: CombatEndedCallback,
    onLoot: LootGeneratedCallback
  ) {
    this.onCombatStarted = onStarted;
    this.onCombatRound = onRound;
    this.onCombatEnded = onEnded;
    this.onLootGenerated = onLoot;

    if (!this.registered) {
      this.setupSocketHandlers();
      this.registered = true;
    }
  }

  public unregisterHandlers() {
    this.onCombatStarted = null;
    this.onCombatRound = null;
    this.onCombatEnded = null;
    this.onLootGenerated = null;
  }

  private setupSocketHandlers() {
    WorldSocket.registerOpCodeHandler(
      OpCodes.CombatStarted,
      CombatStartedResponse,
      (msg: CombatStartedResponse) => {
        if (this.onCombatStarted) {
          if (msg.success === 1) {
            const npc = msg.npc;
            this.onCombatStarted({
              id: npc.id,
              name: npc.name,
              level: npc.level,
              hp: npc.hp,
              maxHp: npc.maxHp,
              ac: npc.ac,
              minDmg: npc.minDmg,
              maxDmg: npc.maxDmg,
              attackDelay: npc.attackDelay,
            });
          } else {
            this.onCombatStarted(null, msg.error);
          }
        }
      }
    );

    WorldSocket.registerOpCodeHandler(
      OpCodes.CombatRound,
      CombatRoundUpdate,
      (msg: CombatRoundUpdate) => {
        if (this.onCombatRound) {
          this.onCombatRound({
            playerHit: msg.playerHit === 1,
            playerDamage: msg.playerDamage,
            playerCritical: msg.playerCritical === 1,
            npcHit: msg.npcHit === 1,
            npcDamage: msg.npcDamage,
            playerHp: msg.playerHp,
            playerMaxHp: msg.playerMaxHp,
            npcHp: msg.npcHp,
            npcMaxHp: msg.npcMaxHp,
            roundNumber: msg.roundNumber,
            npcDied: msg.npcDied === 1,
          });
        }
      }
    );

    WorldSocket.registerOpCodeHandler(
      OpCodes.CombatEnded,
      CombatEndedResponse,
      (msg: CombatEndedResponse) => {
        if (this.onCombatEnded) {
          this.onCombatEnded({
            victory: msg.victory === 1,
            npcName: msg.npcName,
            expGained: msg.expGained,
            playerHp: msg.playerHp,
            playerMaxHp: msg.playerMaxHp,
            bindZoneId: msg.bindZoneId,
            bindX: msg.bindX,
            bindY: msg.bindY,
            bindZ: msg.bindZ,
            bindHeading: msg.bindHeading,
          });
        }
      }
    );

    WorldSocket.registerOpCodeHandler(
      OpCodes.LootGenerated,
      LootGeneratedResponse,
      (msg: LootGeneratedResponse) => {
        if (this.onLootGenerated) {
          const items: LootData["items"] = [];
          const itemList = msg.items;
          for (let i = 0; i < itemList.length; i++) {
            const item = itemList.get(i);
            items.push({
              itemId: item.itemId,
              name: item.name,
              slot: item.slot,
              bagSlot: item.bagSlot,
              charges: item.charges,
              icon: item.icon,
            });
          }
          this.onLootGenerated({
            items,
            platinum: msg.platinum,
            gold: msg.gold,
            silver: msg.silver,
            copper: msg.copper,
          });
        }
      }
    );
  }

  public startCombat() {
    WorldSocket.sendMessage(OpCodes.StartCombat, StartCombatRequest, {});
  }

  public stopCombat() {
    WorldSocket.sendMessage(OpCodes.StopCombat, StopCombatRequest, {});
  }
}

export const combatService = new CombatService();
