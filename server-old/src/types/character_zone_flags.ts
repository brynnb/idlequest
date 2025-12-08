/**
 * Types related to character zone flags
 * Based on the character_zone_flags table in the database
 */

/**
 * Represents a character zone flag from the database
 */
export interface CharacterZoneFlags {
  id: number;
  zoneID: number;
  key_: number;
}

/**
 * Represents a simplified view of a character zone flag
 */
export interface SimpleZoneFlag {
  characterId: number;
  zoneId: number;
  keyValue: number;
}

/**
 * Converts a CharacterZoneFlags object to a SimpleZoneFlag object
 */
export function toSimpleZoneFlag(zoneFlag: CharacterZoneFlags): SimpleZoneFlag {
  return {
    characterId: zoneFlag.id,
    zoneId: zoneFlag.zoneID,
    keyValue: zoneFlag.key_,
  };
}
