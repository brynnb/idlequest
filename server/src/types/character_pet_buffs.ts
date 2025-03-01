/**
 * Types related to character pet buffs
 * Based on the character_pet_buffs table in the database
 */

/**
 * Represents a character pet buff from the database
 */
export interface CharacterPetBuffs {
  char_id: number;
  pet: number;
  slot: number;
  spell_id: number;
  caster_level: number;
  castername: string;
  ticsremaining: number;
  counters: number;
  numhits: number;
  rune: number;
}

/**
 * Represents a simplified view of a character pet buff
 */
export interface SimplePetBuff {
  characterId: number;
  petId: number;
  slotId: number;
  spellId: number;
  casterLevel: number;
  casterName: string;
  ticsRemaining: number;
  counters: number;
  numHits: number;
  rune: number;
}

/**
 * Converts a CharacterPetBuffs object to a SimplePetBuff object
 */
export function toSimplePetBuff(petBuff: CharacterPetBuffs): SimplePetBuff {
  return {
    characterId: petBuff.char_id,
    petId: petBuff.pet,
    slotId: petBuff.slot,
    spellId: petBuff.spell_id,
    casterLevel: petBuff.caster_level,
    casterName: petBuff.castername,
    ticsRemaining: petBuff.ticsremaining,
    counters: petBuff.counters,
    numHits: petBuff.numhits,
    rune: petBuff.rune,
  };
}
