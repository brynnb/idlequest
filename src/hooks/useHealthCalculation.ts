//alleged logic from eqemu, found on a forums post in psuedo code, seems reasonable and makes sense so i'm going with this for now
import useCharacterProfileStore from "../stores/PlayerCharacterStore";

export const useHealthCalculation = () => {
  const { characterProfile } = useCharacterProfileStore();

  const calculateMaxHealth = () => {
    const { class: charClassId, level, attributes } = characterProfile;
    if (!charClassId) return 0;

    let levelMultiplier: number;

    if (!level || !attributes?.sta) return 1;

    switch (charClassId) {
      case 7: // Monk
      case 9: // Rogue
      case 8: // Bard
        levelMultiplier = level <= 50 ? 18 : level <= 57 ? 19 : 20;
        break;
      case 2: // Cleric
      case 6: // Druid
      case 10: // Shaman
        levelMultiplier = 15;
        break;
      case 11: // Magician
      case 12: // Necromancer
      case 14: // Enchanter
      case 13: // Wizard
        levelMultiplier = 12;
        break;
      case 4: // Ranger
        levelMultiplier = level <= 57 ? 20 : 21;
        break;
      case 5: // Shadow Knight
      case 3: // Paladin
        if (level <= 34) levelMultiplier = 21;
        else if (level <= 44) levelMultiplier = 22;
        else if (level <= 50) levelMultiplier = 23;
        else if (level <= 55) levelMultiplier = 24;
        else if (level <= 59) levelMultiplier = 25;
        else levelMultiplier = 26;
        break;
      case 1: // Warrior
        if (level <= 19) levelMultiplier = 22;
        else if (level <= 29) levelMultiplier = 23;
        else if (level <= 39) levelMultiplier = 25;
        else if (level <= 52) levelMultiplier = 27;
        else if (level <= 56) levelMultiplier = 28;
        else if (level <= 59) levelMultiplier = 29;
        else levelMultiplier = 30;
        break;
      default:
        levelMultiplier = 15; // Default multiplier if class is not recognized
    }

    const baseHealth = level * levelMultiplier;
    const staminaBonus = Math.floor(
      ((level * levelMultiplier) / 300) * attributes.sta + 5
    );
    const totalHealth = baseHealth + staminaBonus;

    return totalHealth;
  };

  return calculateMaxHealth;
};
