/**
 * Types related to spell globals
 * Based on the spell_globals table in the database
 */

/**
 * Represents a spell global entry from the database
 */
export interface SpellGlobals {
  spellid: number;
  spell_name: string;
  qglobal: string;
  value: string;
}

/**
 * Represents a simplified view of a spell global entry
 */
export interface SimpleSpellGlobal {
  spellId: number;
  spellName: string;
  questGlobal: string;
  value: string;
}

/**
 * Converts a SpellGlobals object to a SimpleSpellGlobal object
 */
export function toSimpleSpellGlobal(
  spellGlobal: SpellGlobals
): SimpleSpellGlobal {
  return {
    spellId: spellGlobal.spellid,
    spellName: spellGlobal.spell_name,
    questGlobal: spellGlobal.qglobal,
    value: spellGlobal.value,
  };
}
