import { Item } from "../entities/Item";
import CharacterClass from "../entities/CharacterClass";

const MELEE_CLASSES = [1, 7, 9, 16]; // Warrior, Monk, Rogue, Berserker
const HYBRID_CLASSES = [3, 4, 5, 8, 15]; // Paladin, Ranger, Shadow Knight, Bard, Beastlord
const CASTER_CLASSES = [2, 6, 10, 11, 12, 13, 14]; // Cleric, Druid, Shaman, Necromancer, Wizard, Magician, Enchanter

function getItemScore(item: Item, characterClass: CharacterClass): number {
  let ratioScore = 0;
  let attributeScore = 0;

  // Calculate ratio score for weapons
  if (item.delay && item.damage && item.delay > 0) {
    const damagePerSecond = item.damage / (item.delay / 100);
    ratioScore = damagePerSecond * 2;
  }

  // Calculate attribute score
  const weights = getClassWeights(characterClass.id);
  attributeScore += Math.max(0, item.hp || 0) * weights.hp;
  attributeScore += Math.max(0, item.mana || 0) * weights.mana;
  attributeScore += Math.max(0, item.ac || 0) * weights.ac;
  attributeScore += (item.astr || 0) * weights.str;
  attributeScore += (item.asta || 0) * weights.sta;
  attributeScore += (item.aagi || 0) * weights.agi;
  attributeScore += (item.adex || 0) * weights.dex;
  attributeScore += (item.aint || 0) * weights.int;
  attributeScore += (item.awis || 0) * weights.wis;
  attributeScore += (item.acha || 0) * weights.cha;

  // Special effects and procs
  if (item.proceffect) attributeScore += 10;
  if (item.clickeffect) attributeScore += 5;

  // Determine the ratio of ratio score to attribute score based on class type
  let ratioWeight = 0.05;
  if (MELEE_CLASSES.includes(characterClass.id)) {
    ratioWeight = 0.9;
  } else if (HYBRID_CLASSES.includes(characterClass.id)) {
    ratioWeight = 0.75;
  }

  // Calculate final score
  let finalScore =
    ratioScore * ratioWeight + attributeScore * (1 - ratioWeight);

  // Adjust score based on required level
  if (item.reqlevel) {
    finalScore *= 1 + item.reqlevel / 100;
  }

  return Math.max(0, Math.round(finalScore));
}

function getClassWeights(classId: number): { [key: string]: number } {
  switch (classId) {
    case 1: // Warrior
      return {
        hp: 1.0,
        mana: 0,
        ac: 1.0,
        str: 0.8,
        sta: 1.0,
        agi: 0.6,
        dex: 0.4,
        int: 0,
        wis: 0,
        cha: 0,
        resists: 0.2,
      };
    case 2: // Cleric
      return {
        hp: 0.6,
        mana: 1.0,
        ac: 0.4,
        str: 0,
        sta: 0.4,
        agi: 0,
        dex: 0,
        int: 0,
        wis: 5.0,
        cha: 0,
        resists: 0.3,
      };
    case 3: // Paladin
      return {
        hp: 0.8,
        mana: 0.6,
        ac: 0.8,
        str: 0.6,
        sta: 0.8,
        agi: 0,
        dex: 0,
        int: 0,
        wis: 0.8,
        cha: 0,
        resists: 0.2,
      };
    case 4: // Ranger
      return {
        hp: 0.6,
        mana: 0.4,
        ac: 0.4,
        str: 0.8,
        sta: 0.6,
        agi: 0.4,
        dex: 0.8,
        int: 0,
        wis: 0.4,
        cha: 0,
        resists: 0.2,
      };
    case 5: // Shadow Knight
      return {
        hp: 0.8,
        mana: 0.6,
        ac: 0.8,
        str: 0.8,
        sta: 0.8,
        agi: 0,
        dex: 0,
        int: 0.6,
        wis: 0,
        cha: 0,
        resists: 0.2,
      };
    case 6: // Druid
      return {
        hp: 0.4,
        mana: 1.0,
        ac: 0.2,
        str: 0,
        sta: 0.2,
        agi: 0,
        dex: 0,
        int: 0,
        wis: 5.0,
        cha: 0,
        resists: 0.4,
      };
    case 7: // Monk
      return {
        hp: 0.6,
        mana: 0,
        ac: 0.6,
        str: 0.8,
        sta: 0.8,
        agi: 1.0,
        dex: 0.4,
        int: 0,
        wis: 0,
        cha: 0,
        resists: 0.2,
      };
    case 8: // Bard
      return {
        hp: 0.4,
        mana: 0.4,
        ac: 0.4,
        str: 0.2,
        sta: 0.6,
        agi: 0.4,
        dex: 0.8,
        int: 0,
        wis: 0,
        cha: 1.0,
        resists: 0.3,
      };
    case 9: // Rogue
      return {
        hp: 0.4,
        mana: 0,
        ac: 0.4,
        str: 0.8,
        sta: 0.6,
        agi: 0.6,
        dex: 1.0,
        int: 0,
        wis: 0,
        cha: 0,
        resists: 0.2,
      };
    case 10: // Shaman
      return {
        hp: 0.4,
        mana: 1.0,
        ac: 0.2,
        str: 0,
        sta: 0.4,
        agi: 0,
        dex: 0,
        int: 0,
        wis: 5.0,
        cha: 0,
        resists: 0.4,
      };
    case 11: // Necromancer
      return {
        hp: 0.2,
        mana: 1.0,
        ac: 0.1,
        str: 0,
        sta: 0.2,
        agi: 0,
        dex: 0,
        int: 5.0,
        wis: 0,
        cha: 0,
        resists: 0.3,
      };
    case 12: // Wizard
      return {
        hp: 0.2,
        mana: 1.0,
        ac: 0.1,
        str: 0,
        sta: 0.1,
        agi: 0,
        dex: 0,
        int: 5.0,
        wis: 0,
        cha: 0,
        resists: 0.4,
      };
    case 13: // Magician
      return {
        hp: 0.2,
        mana: 1.0,
        ac: 0.1,
        str: 0,
        sta: 0.1,
        agi: 0,
        dex: 0,
        int: 5.0,
        wis: 0,
        cha: 0,
        resists: 0.3,
      };
    case 14: // Enchanter
      return {
        hp: 0.2,
        mana: 1.0,
        ac: 0.1,
        str: 0,
        sta: 0.1,
        agi: 0,
        dex: 0,
        int: 5,
        wis: 0,
        cha: 2.0,
        resists: 0.4,
      };
    case 15: // Beastlord
      return {
        hp: 0.6,
        mana: 0.6,
        ac: 0.4,
        str: 0.4,
        sta: 0.6,
        agi: 0.2,
        dex: 0.6,
        int: 0,
        wis: 0.8,
        cha: 0,
        resists: 0.3,
      };
    case 16: // Berserker
      return {
        hp: 0.8,
        mana: 0,
        ac: 0.6,
        str: 1.0,
        sta: 0.8,
        agi: 0.4,
        dex: 0.6,
        int: 0,
        wis: 0,
        cha: 0,
        resists: 0.2,
      };
    default:
      return {
        hp: 0,
        mana: 0,
        ac: 0,
        str: 0,
        sta: 0,
        agi: 0,
        dex: 0,
        int: 0,
        wis: 0,
        cha: 0,
        resists: 0,
      };
  }
}

export default getItemScore;
