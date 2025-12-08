/**
 * Types related to character pet information
 * Based on the character_pet_info table in the database
 */

/**
 * Represents character pet information from the database
 */
export interface CharacterPetInfo {
  char_id: number;
  pet: number;
  petname: string;
  petpower: number;
  spell_id: number;
  hp: number;
  mana: number;
  size: number;
}

/**
 * Represents a simplified view of character pet information
 */
export interface SimplePetInfo {
  characterId: number;
  petId: number;
  name: string;
  power: number;
  spellId: number;
  hp: number;
  mana: number;
  size: number;
}

/**
 * Converts a CharacterPetInfo object to a SimplePetInfo object
 */
export function toSimplePetInfo(petInfo: CharacterPetInfo): SimplePetInfo {
  return {
    characterId: petInfo.char_id,
    petId: petInfo.pet,
    name: petInfo.petname,
    power: petInfo.petpower,
    spellId: petInfo.spell_id,
    hp: petInfo.hp,
    mana: petInfo.mana,
    size: petInfo.size,
  };
}
