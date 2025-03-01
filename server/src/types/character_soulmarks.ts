/**
 * Types related to character soulmarks
 * Based on the character_soulmarks table in the database
 */

/**
 * Represents a character soulmark
 */
export interface CharacterSoulmark {
  id: number;
  charid: number;
  charname: string;
  acctid: number;
  gmid: number;
  gmname: string;
  utime: number;
  type: number;
  desc: string;
}

/**
 * Represents a simplified view of a character soulmark
 */
export interface SimpleSoulmark {
  id: number;
  characterId: number;
  characterName: string;
  accountId: number;
  gmId: number;
  gmName: string;
  timestamp: Date;
  type: number;
  description: string;
}

/**
 * Converts a CharacterSoulmark to a SimpleSoulmark
 */
export function toSimpleSoulmark(soulmark: CharacterSoulmark): SimpleSoulmark {
  return {
    id: soulmark.id,
    characterId: soulmark.charid,
    characterName: soulmark.charname,
    accountId: soulmark.acctid,
    gmId: soulmark.gmid,
    gmName: soulmark.gmname,
    timestamp: new Date(soulmark.utime * 1000),
    type: soulmark.type,
    description: soulmark.desc,
  };
}
