/**
 * Types related to character buffs
 * Based on the character_buffs table in the database
 */

/**
 * Represents a character buff from the database
 */
export interface CharacterBuffs {
  id: number;
  slot_id: number;
  spell_id: number;
  caster_level: number;
  caster_name: string;
  ticsremaining: number;
  counters: number;
  melee_rune: number;
  magic_rune: number;
  persistent: number;
  ExtraDIChance: number;
  bard_modifier: number;
  bufftype: number;
}

/**
 * Represents a simplified view of a character buff
 */
export interface SimpleBuff {
  slotId: number;
  spellId: number;
  casterLevel: number;
  casterName: string;
  ticsRemaining: number;
  counters: number;
  meleeRune: number;
  magicRune: number;
  isPersistent: boolean;
  extraDIChance: number;
  bardModifier: number;
  buffType: number;
}

/**
 * Converts a CharacterBuffs object to a SimpleBuff object
 */
export function toSimpleBuff(buff: CharacterBuffs): SimpleBuff {
  return {
    slotId: buff.slot_id,
    spellId: buff.spell_id,
    casterLevel: buff.caster_level,
    casterName: buff.caster_name,
    ticsRemaining: buff.ticsremaining,
    counters: buff.counters,
    meleeRune: buff.melee_rune,
    magicRune: buff.magic_rune,
    isPersistent: buff.persistent === 1,
    extraDIChance: buff.ExtraDIChance,
    bardModifier: buff.bard_modifier,
    buffType: buff.bufftype,
  };
}
