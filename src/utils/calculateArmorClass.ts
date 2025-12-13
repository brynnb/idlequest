//based on: https://rexaraven.com/everquest/how-stuff-works-armor-class/, which is based on https://forums.daybreakgames.com/eq/index.php?threads/ac-vs-acv2.210028/#post-3078126
//this method of calculation is extremely complex and so is not being used for now. implementaiton also seems fairly broken as a few basic tests return AC numbers much lower than they should (e.g. 30 AC instead of like 300+)
import CharacterProfile from "@entities/CharacterProfile";
import CharacterClass from "@entities/CharacterClass";
import { calculateTotalEquippedAC } from "@utils/inventoryUtils";
import { RaceId } from "@entities/Race";
import { ClassId } from "@entities/CharacterClass";
import * as fs from "fs";

const getClassId = (cls: CharacterProfile["class"]): number => {
  if (typeof cls === "number") return cls;
  return cls?.id ?? 0;
};

const getRaceId = (race: CharacterProfile["race"]): number => {
  if (typeof race === "number") return race;
  return race?.id ?? 0;
};

interface ACMitigationData {
  [classId: number]: {
    [level: number]: {
      baseAC: number;
      softCapMultiplier: number;
    };
  };
}

const readACMitigationFile = (): ACMitigationData => {
  const fileContent = fs.readFileSync("data/ACMitigation.txt", "utf-8");
  const lines = fileContent.split("\n").slice(1); // Skip the header line

  const acMitigationData: ACMitigationData = {};

  lines.forEach((line) => {
    const [classId, level, baseAC, softCapMultiplier] = line
      .split("^")
      .map(Number);

    if (!acMitigationData[classId]) {
      acMitigationData[classId] = {};
    }

    acMitigationData[classId][level] = {
      baseAC,
      softCapMultiplier,
    };
  });

  return acMitigationData;
};

// Helper functions (implement these based on your data structures)
const getDefenseSkill = (_character: CharacterProfile): number => {
  void _character;
  // Implement this based on your character data structure
  return 1;
};

const getWeight = (_character: CharacterProfile): number => {
  void _character;
  // Implement this based on your character data structure
  return 0;
};

const getShieldAC = (_character: CharacterProfile): number => {
  void _character;
  // Get AC from equipped shield, if any
  return 0;
};

const getConsumablesAC = (_character: CharacterProfile): number => {
  void _character;
  // Get AC from food, drink, tribute items, etc.
  return 0;
};

const getMonkHardCapWeight = (level: number): number => {
  return 100 + (level - 1) * 5;
};

const getMonkSoftCapWeight = (level: number): number => {
  return 100 + (level - 1) * 5;
};

const getHerosFortitudeValue = (_character: CharacterProfile): number => {
  void _character;
  // Get Hero's Fortitude AA value
  return 0;
};

const getArmorOfWisdomValue = (_character: CharacterProfile): number => {
  void _character;
  // Get Armor of Wisdom AA value
  return 0;
};

const getItemAvoidance = (_character: CharacterProfile): number => {
  void _character;
  // Get Item Avoidance AA value
  return 0;
};

const getCombatAgilityValue = (_character: CharacterProfile): number => {
  void _character;
  // Get Combat Agility AA value
  return 0;
};

const getPhysicalEnhancementValue = (_character: CharacterProfile): number => {
  void _character;
  // Get Physical Enhancement AA value
  return 0;
};

const getHeroicAgility = (_character: CharacterProfile): number => {
  void _character;
  // Get Heroic Agility AA value
  return 0;
};

const getRaceClassBonus = (character: CharacterProfile): number => {
  let bonus = 0;

  const level = character.level || 0;
  const classId = getClassId(character.class);
  const raceId = getRaceId(character.race);

  if (raceId === RaceId.Iksar) {
    bonus = Math.max(10, Math.min(35, level));
  }

  // Rogue AC Bonus
  if (classId === ClassId.Rogue && level > 30) {
    const agility = character.attributes?.agi || 0;
    const levelScaler = level - 26;
    let acBonus = 0;

    if (agility >= 75) {
      if (agility < 80) {
        acBonus = (levelScaler * 1) / 4;
      } else if (agility < 85) {
        acBonus = (levelScaler * 2) / 4;
      } else if (agility < 90) {
        acBonus = (levelScaler * 3) / 4;
      } else if (agility < 100) {
        acBonus = (levelScaler * 4) / 4;
      } else {
        acBonus = (levelScaler * 5) / 4;
      }

      acBonus = Math.min(acBonus, 12);
      bonus += acBonus;
    }
  }

  // Monk AC Bonus and Penalty
  if (classId === ClassId.Monk) {
    const weight = getWeight(character);
    const hardCapWeight = getMonkHardCapWeight(level);
    const softCapWeight = getMonkSoftCapWeight(level);

    if (weight <= softCapWeight) {
      bonus += level + 5;
    } else if (weight <= hardCapWeight) {
      const reduction = Math.min(100, (weight - softCapWeight) * 6.66667);
      bonus += Math.max(0, (level + 5) * (1 - reduction / 100));
    } else {
      const multiplier = Math.min(1, (weight - (hardCapWeight - 10)) / 100);
      bonus -= multiplier * (level + 5);
    }

    bonus = (bonus * 4) / 3;
  }

  // Beastlord AC Bonus
  if (classId === ClassId.Beastlord && level > 10) {
    const agility = character.attributes?.agi || 0;
    const levelScaler = level - 6;
    let acBonus = 0;

    if (agility >= 75) {
      if (agility < 80) {
        acBonus = (levelScaler * 1) / 5;
      } else if (agility < 85) {
        acBonus = (levelScaler * 2) / 5;
      } else if (agility < 90) {
        acBonus = (levelScaler * 3) / 5;
      } else if (agility < 100) {
        acBonus = (levelScaler * 4) / 5;
      } else {
        acBonus = levelScaler;
      }

      acBonus = Math.min(acBonus, 16);
      bonus += acBonus;
    }
  }

  // Add other race/class bonuses (Monk, Beastlord) here
  // ...

  return bonus;
};

const getSpellAC = (_character: CharacterProfile): number => {
  void _character;
  // Calculate AC from buffs (SPA 1 and SPA 416)
  return 0;
};

const getAABonus = (character: CharacterProfile): number => {
  const armorOfWisdom = getArmorOfWisdomValue(character);
  const herosFortitude = getHerosFortitudeValue(character);
  const classId = getClassId(character.class);
  const isSilk = isSilkCaster(classId);

  const armorOfWisdomDivisor = getArmorOfWisdomDivisor(classId);
  const herosFortitudeDivisor = isSilk ? 3 : 4;

  return (
    armorOfWisdom / armorOfWisdomDivisor +
    herosFortitude / herosFortitudeDivisor
  );
};

const getCombatStability = (_character: CharacterProfile): number => {
  void _character;
  // Get Combat Stability AA value
  return 0;
};

const getPhysicalEnhancement = (_character: CharacterProfile): number => {
  void _character;
  // Get Physical Enhancement AA value
  return 0;
};
const isSilkCaster = (
  characterClass: number | CharacterClass | undefined
): boolean => {
  const classId =
    typeof characterClass === "number" ? characterClass : characterClass?.id;
  return classId !== undefined && [11, 12, 13, 14].includes(classId); // Mag, Nec, Enc, Wiz
};

const getBaseAC = (characterClass: number, level: number): number => {
  const acMitigationData = readACMitigationFile();
  return acMitigationData[characterClass]?.[level]?.baseAC || 0;
};

const getSoftCapMultiplier = (
  characterClass: number,
  level: number
): number => {
  const acMitigationData = readACMitigationFile();
  return acMitigationData[characterClass]?.[level]?.softCapMultiplier || 0;
};

const calculateACSUM = (character: CharacterProfile): number => {
  let acSum = calculateTotalEquippedAC(character) + getConsumablesAC(character);
  acSum = (acSum * 4) / 3;

  const level = character.level || 0;
  const classId = getClassId(character.class);

  if (level < 50) {
    acSum = Math.min(acSum, 25 + 6 * level);
  }

  acSum += getRaceClassBonus(character);
  acSum = Math.max(0, acSum);

  const isSilk = isSilkCaster(classId);
  acSum += isSilk
    ? getDefenseSkill(character) / 2
    : getDefenseSkill(character) / 3;
  acSum += isSilk ? getSpellAC(character) / 3 : getSpellAC(character) / 4;
  acSum += getAABonus(character);

  const functionalAgility = character.attributes?.agi || 0;
  if (functionalAgility > 70) {
    acSum += Math.floor(functionalAgility / 20);
  }

  return Math.max(0, acSum);
};

const calculateMitigationAC = (character: CharacterProfile): number => {
  const acSum = calculateACSUM(character);
  const level = character.level || 0;
  const classId = getClassId(character.class);
  const baseAC = getBaseAC(classId, level);
  const combatStability = getCombatStability(character);
  const physicalEnhancement = getPhysicalEnhancement(character);

  let softCapAC =
    baseAC + (baseAC * (combatStability + physicalEnhancement)) / 100;
  softCapAC +=
    getShieldAC(character) + Math.floor((character.attributes?.str || 0) / 10);

  const softCapMultiplier = getSoftCapMultiplier(classId, level);

  if (acSum > softCapAC) {
    const postCapAC = (acSum - softCapAC) * softCapMultiplier;
    return Math.floor(softCapAC + postCapAC);
  }

  return acSum;
};

const calculateAgilityBonus = (character: CharacterProfile): number => {
  const agi = character.attributes?.agi || 0;
  const heroicAgi = getHeroicAgility(character); // Implement this function
  const functionalAgility = agi + heroicAgi;

  const agilityBonus =
    (8000 * (functionalAgility - 40)) / 36000 + heroicAgi / 10;
  return agilityBonus;
};

const calculateDrunkennessReduction = (character: CharacterProfile): number => {
  const intoxication = character.intoxication || 0;
  const drunkValue = intoxication / 2;
  const reduction = (110 - drunkValue) / 100;
  return Math.min(1, Math.max(0, reduction));
};

const calculateAAAvoidance = (character: CharacterProfile): number => {
  const combatAgility = getCombatAgilityValue(character); // Implement this function
  const physicalEnhancement = getPhysicalEnhancementValue(character); // Implement this function
  return (100 + combatAgility + physicalEnhancement) / 100;
};

const getArmorOfWisdomDivisor = (characterClassId: number): number => {
  const characterClass = characterClassId as ClassId;
  switch (characterClass) {
    case ClassId.Enchanter:
    case ClassId.Magician:
    case ClassId.Necromancer:
    case ClassId.Wizard:
      return 3;
    case ClassId.Bard:
    case ClassId.Cleric:
    case ClassId.Monk:
    case ClassId.Ranger:
    case ClassId.Beastlord:
    case ClassId.Berserker:
    case ClassId.Druid:
    case ClassId.Rogue:
    case ClassId.Shaman:
    case ClassId.Paladin:
    case ClassId.ShadowKnight:
    case ClassId.Warrior:
      return 4;
    default:
      return 4; // Default divisor
  }
};

const calculateEvasionAC = (character: CharacterProfile): number => {
  const defenseSkill = getDefenseSkill(character);
  const agilityBonus = calculateAgilityBonus(character);
  const itemAvoidance = getItemAvoidance(character);
  const drunkennessReduction = calculateDrunkennessReduction(character);
  const aaAvoidance = calculateAAAvoidance(character);

  let evasionAC = (defenseSkill * 400) / 225;
  evasionAC += agilityBonus;
  evasionAC += itemAvoidance;
  evasionAC = Math.floor(evasionAC * drunkennessReduction);
  evasionAC += 10;
  evasionAC = Math.floor(evasionAC * aaAvoidance);

  return Math.max(1, evasionAC);
};

export const calculateArmorClass = (
  character: CharacterProfile
): { displayedMitigationAC: number; displayedEvasionAC: number } => {
  const mitigationAC = calculateMitigationAC(character);
  const evasionAC = calculateEvasionAC(character);

  return { displayedMitigationAC: mitigationAC, displayedEvasionAC: evasionAC };
};
