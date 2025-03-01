/**
 * Types related to character spells
 * Based on the character_spells table in the database
 */

/**
 * Represents a character spell from the database
 */
export interface CharacterSpells {
  id: number;
  slot_id: number;
  spell_id: number;
}

/**
 * Represents a simplified view of a character spell
 */
export interface SimpleSpell {
  slotId: number;
  spellId: number;
}

/**
 * Converts a CharacterSpells object to a SimpleSpell object
 */
export function toSimpleSpell(spell: CharacterSpells): SimpleSpell {
  return {
    slotId: spell.slot_id,
    spellId: spell.spell_id,
  };
}
