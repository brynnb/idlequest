/**
 * Types related to quest globals
 * Based on the quest_globals table in the database
 */

/**
 * Represents a quest global from the database
 */
export interface QuestGlobals {
  charid: number;
  npcid: number;
  zoneid: number;
  name: string;
  value: string;
  expdate: number | null;
}

/**
 * Represents a simplified view of a quest global
 */
export interface SimpleQuestGlobal {
  characterId: number;
  npcId: number;
  zoneId: number;
  name: string;
  value: string;
  expirationDate: number | null;
}

/**
 * Converts a QuestGlobals object to a SimpleQuestGlobal object
 */
export function toSimpleQuestGlobal(global: QuestGlobals): SimpleQuestGlobal {
  return {
    characterId: global.charid,
    npcId: global.npcid,
    zoneId: global.zoneid,
    name: global.name,
    value: global.value,
    expirationDate: global.expdate,
  };
}
