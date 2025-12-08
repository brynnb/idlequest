/**
 * Types related to character faction values
 * Based on the character_faction_values table in the database
 */

/**
 * Represents a character faction value from the database
 */
export interface CharacterFactionValues {
  id: number;
  faction_id: number;
  current_value: number;
  temp: number;
}

/**
 * Represents a simplified view of a character faction value
 */
export interface SimpleFactionValue {
  characterId: number;
  factionId: number;
  currentValue: number;
  isTemporary: boolean;
}

/**
 * Converts a CharacterFactionValues object to a SimpleFactionValue object
 */
export function toSimpleFactionValue(
  factionValue: CharacterFactionValues
): SimpleFactionValue {
  return {
    characterId: factionValue.id,
    factionId: factionValue.faction_id,
    currentValue: factionValue.current_value,
    isTemporary: factionValue.temp === 1,
  };
}
