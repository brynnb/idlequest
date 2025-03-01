/**
 * Types related to character memorized spells
 * Based on the character_memmed_spells table in the database
 */

/**
 * Represents a character memorized spell from the database
 */
export interface CharacterMemmedSpells {
  id: number;
  slot_id: number;
  spell_id: number;
}

/**
 * Represents a simplified view of a character memorized spell
 */
export interface SimpleMemmedSpell {
  characterId: number;
  slotId: number;
  spellId: number;
}

/**
 * Converts a CharacterMemmedSpells object to a SimpleMemmedSpell object
 */
export function toSimpleMemmedSpell(
  memmedSpell: CharacterMemmedSpells
): SimpleMemmedSpell {
  return {
    characterId: memmedSpell.id,
    slotId: memmedSpell.slot_id,
    spellId: memmedSpell.spell_id,
  };
}
