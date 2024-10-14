//very simple AC approach, based on https://www.project1999.com/forums/showthread.php?t=308
import CharacterProfile from "@entities/CharacterProfile";
import { calculateTotalEquippedAC } from "@utils/inventoryUtils";
import { RaceId } from "@entities/Race";

const calcBaseAC = (level: number): number => {
  if (level <= 19) {
    return level * 15;
  } else if (level <= 49) {
    return 285 + (level - 19) * 30;
  } else {
    return 1185 + (level - 49) * 60;
  }
};

const getIksarBonus = (character: CharacterProfile): number => {
  if (character.race?.id === RaceId.Iksar) {
    const level = character.level || 0;
    return Math.max(10, Math.min(35, level));
  }
  return 0;
};

const calculateSimpleArmorClass = (character: CharacterProfile): number => {
  const baseAC = calcBaseAC(character.level);
  const equippedAC = calculateTotalEquippedAC(character);
  const iksarBonus = getIksarBonus(character);

  return baseAC + equippedAC + iksarBonus;
};

export { calculateSimpleArmorClass };
