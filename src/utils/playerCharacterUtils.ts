//sourced from here, may not be totally accurate, but spot check looks good: https://www.eqemulator.org/forums/showthread.php?t=14911
import CharacterProfile from "@entities/CharacterProfile";

const getHpLevelMultiplier = (
  characterClass: number,
  level: number
): number => {
  switch (characterClass) {
    case 1: // Warrior
      if (level <= 19) return 22;
      if (level <= 29) return 23;
      if (level <= 39) return 25;
      if (level <= 52) return 27;
      if (level <= 56) return 28;
      if (level <= 59) return 29;
      return 30;
    case 2: // Cleric
    case 6: // Druid
    case 10: // Shaman
      return 15;
    case 3: // Paladin
    case 5: // Shadowknight
    case 16: // Berserker
      if (level <= 34) return 21;
      if (level <= 44) return 22;
      if (level <= 50) return 23;
      if (level <= 55) return 24;
      if (level <= 59) return 25;
      return 26;
    case 4: // Ranger
      if (level <= 57) return 20;
      return 21;
    case 7: // Monk
    case 8: // Bard
    case 9: // Rogue
    case 15: // Beastlord
      if (level <= 50) return 18;
      if (level <= 57) return 19;
      return 20;
    case 11: // Magician
    case 12: // Necromancer
    case 13: // Enchanter
    case 14: // Wizard
      return 12;
    default:
      console.log("Unknown character class", characterClass);
      return 15; // Default multiplier
  }
};

export const calculatePlayerHP = (character: CharacterProfile): number => {
  if (!character.level || !character.class || !character.attributes?.sta) {
    return 0;
  }

  const level = character.level;
  const stamina = character.attributes.sta;
  const levelMultiplier = getHpLevelMultiplier(character.class.id, level);

  const term1 = level * levelMultiplier;
  const term2 = ((level * levelMultiplier) / 300) * stamina + 5;

  return Math.floor(term1 + term2);
};

