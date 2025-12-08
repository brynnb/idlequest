import { MessageType } from "../types/message.js";
import { broadcastMessage } from "../socket.js";
import { logger } from "./logger.js";

/**
 * Broadcasts a combat message to all connected clients
 * @param text The message text
 * @param type The message type
 */
export const broadcastCombatMessage = (
  text: string,
  type: MessageType
): void => {
  const message = {
    id: Date.now(),
    text,
    timestamp: Date.now(),
    type,
  };

  logger.debug(`Broadcasting message: ${text}`);
  broadcastMessage(message);
};

/**
 * Broadcasts a system announcement to all connected clients
 * @param text The announcement text
 */
export const broadcastSystemAnnouncement = (text: string): void => {
  broadcastCombatMessage(text, MessageType.SYSTEM);
};

/**
 * Broadcasts a combat event to all connected clients
 * @param attacker The name of the attacker
 * @param target The name of the target
 * @param damage The amount of damage dealt
 * @param isCritical Whether the hit was critical
 */
export const broadcastCombatEvent = (
  attacker: string,
  target: string,
  damage: number,
  isCritical: boolean = false
): void => {
  const text = isCritical
    ? `${attacker} critically hits ${target} for ${damage} damage!`
    : `${attacker} hits ${target} for ${damage} damage.`;

  broadcastCombatMessage(text, MessageType.COMBAT_OUTGOING);
};

/**
 * Broadcasts a death event to all connected clients
 * @param character The name of the character who died
 */
export const broadcastDeathEvent = (character: string): void => {
  broadcastCombatMessage(`${character} has been slain!`, MessageType.DEATH);
};

/**
 * Broadcasts a loot event to all connected clients
 * @param character The name of the character who looted
 * @param item The name of the item looted
 * @param quantity The quantity of the item looted
 */
export const broadcastLootEvent = (
  character: string,
  item: string,
  quantity: number = 1
): void => {
  const text =
    quantity > 1
      ? `${character} loots ${quantity}x ${item}.`
      : `${character} loots ${item}.`;

  broadcastCombatMessage(text, MessageType.LOOT);
};
