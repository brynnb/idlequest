//Based off eqemu code here: https://github.com/EQEmu/Server/blob/master/zone/spell_effects.cpp#L3500
import { Spell } from "@entities/Spell";

function calcBuffDuration(
  _casterLevel: number,
  _durationFormula: number,
  baseDuration: number
): number {
  // Implement the buff duration calculation logic here
  // This is a placeholder implementation
  return baseDuration;
}

export function calcSpellEffectValue(
  formula: number,
  baseValue: number,
  maxValue: number,
  casterLevel: number,
  spell: Spell,
  ticsRemaining: number
): number {
  let result = 0;
  let updownsign = 1;
  const ubase = Math.abs(baseValue);

  if (maxValue < baseValue && maxValue !== 0) {
    updownsign = -1;
  }

  // console.log(
  //   `spell [${spell.id}] formula [${formula}] base [${baseValue}] max [${maxValue}] lvl [${casterLevel}] Up/Down [${updownsign}]`
  // );

  switch (formula) {
    case 60:
    case 70:
      result = Math.floor(ubase / 100);
      break;
    case 0:
    case 100:
      result = ubase;
      break;
    case 101:
      result = updownsign * (ubase + Math.floor(casterLevel / 2));
      break;
    case 102:
      result = updownsign * (ubase + casterLevel);
      break;
    case 103:
      result = updownsign * (ubase + casterLevel * 2);
      break;
    case 104:
      result = updownsign * (ubase + casterLevel * 3);
      break;
    case 105:
      result = updownsign * (ubase + casterLevel * 4);
      break;
    case 107:
    case 108:
    case 120:
    case 122: {
      const ticdif =
        calcBuffDuration(
          casterLevel,
          spell.buffdurationformula,
          spell.buffduration
        ) - Math.max(ticsRemaining - 1, 0);
      const multiplier =
        formula === 107 ? 1 : formula === 108 ? 2 : formula === 120 ? 5 : 12;
      result = updownsign * (ubase - multiplier * Math.max(ticdif, 0));
      break;
    }
    case 109:
      result = updownsign * (ubase + Math.floor(casterLevel / 4));
      break;
    case 110:
      result = ubase + Math.floor(casterLevel / 6);
      break;
    case 111:
      result = updownsign * (ubase + 6 * Math.max(casterLevel - 16, 0));
      break;
    case 112:
      result = updownsign * (ubase + 8 * Math.max(casterLevel - 24, 0));
      break;
    case 113:
      result = updownsign * (ubase + 10 * Math.max(casterLevel - 34, 0));
      break;
    case 114:
      result = updownsign * (ubase + 15 * Math.max(casterLevel - 44, 0));
      break;
    case 115:
      result = ubase;
      if (casterLevel > 15) result += 7 * (casterLevel - 15);
      break;
    case 116:
      result = ubase;
      if (casterLevel > 24) result += 10 * (casterLevel - 24);
      break;
    case 117:
      result = ubase;
      if (casterLevel > 34) result += 13 * (casterLevel - 34);
      break;
    case 118:
      result = ubase;
      if (casterLevel > 44) result += 20 * (casterLevel - 44);
      break;
    case 119:
      result = ubase + Math.floor(casterLevel / 8);
      break;
    case 121:
      result = ubase + Math.floor(casterLevel / 3);
      break;
    case 123:
      result =
        Math.floor(Math.random() * (Math.abs(maxValue) - ubase + 1)) + ubase;
      break;
    case 124:
    case 125:
    case 126:
    case 127:
    case 128:
    case 129:
    case 130:
    case 131:
    case 132: {
      result = ubase;
      if (casterLevel > 50) {
        const multiplier = [1, 2, 3, 4, 5, 10, 15, 20, 25][formula - 124];
        result += updownsign * multiplier * (casterLevel - 50);
      }
      break;
    }
    case 137:
      // Note: GetHPRatio() is not available, so this is a placeholder
      result = ubase - Math.floor(ubase * (50 / 100)); // Assuming 50% HP
      break;
    case 138: {
      // Note: GetMaxHP() and GetHP() are not available, so this is a placeholder
      const maxhps = 1000 / 2; // Placeholder value
      const currentHP = 500; // Placeholder value
      if (currentHP <= maxhps) {
        result = -((ubase * currentHP) / maxhps);
      } else {
        result = -ubase;
      }
      break;
    }
    case 139:
      result =
        ubase + (casterLevel > 30 ? Math.floor((casterLevel - 30) / 2) : 0);
      break;
    case 140:
      result = ubase + (casterLevel > 30 ? casterLevel - 30 : 0);
      break;
    case 141:
      result =
        ubase + (casterLevel > 30 ? Math.floor((3 * casterLevel - 90) / 2) : 0);
      break;
    case 142:
      result = ubase + (casterLevel > 30 ? 2 * casterLevel - 60 : 0);
      break;
    case 143:
      result = ubase + Math.floor((3 * casterLevel) / 4);
      break;
    case 144:
      result = ubase + casterLevel * 10 + Math.max(casterLevel - 40, 0) * 20;
      break;
    case 201:
    case 203:
      result = maxValue;
      break;
    default:
      if (formula < 100) {
        result = ubase + casterLevel * formula;
      } else if (formula > 1000 && formula < 1999) {
        const ticdif =
          calcBuffDuration(
            casterLevel,
            spell.buffdurationformula,
            spell.buffduration
          ) - Math.max(ticsRemaining - 1, 0);
        result = updownsign * (ubase - (formula - 1000) * Math.max(ticdif, 0));
      } else if (formula >= 2000 && formula <= 2650) {
        result = ubase * (casterLevel * (formula - 2000) + 1);
      } else {
        console.warn(`Unknown spell effect value formula [${formula}]`);
      }
  }

  // Apply max value cap only if maxValue is not 0
  if (maxValue !== 0) {
    if (updownsign === 1) {
      result = Math.min(result, maxValue);
    } else {
      result = Math.max(result, -maxValue);
    }
  }

  // Preserve the sign of the base value
  if (baseValue < 0) {
    result = -Math.abs(result);
  }

  // console.log(
  //   `Result: [${result}] (orig [${oresult}]) cap [${maxValue}] ${
  //     baseValue < 0 ? "Negative base value preserved" : ""
  //   }`
  // );

  return result;
}
