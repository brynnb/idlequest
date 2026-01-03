import React from "react";
import { Item } from "@entities/Item";
import { Spell } from "@entities/Spell";
import { eqDataService, Spell as ServiceSpell } from "@utils/eqDataService";
import useStaticDataStore from "@stores/StaticDataStore";
import { calcSpellEffectValue } from "@utils/spellCalculations";

interface SpellInfo {
  spell: Spell;
  description: string | null;
}

function processSpellDescription(description: string, spell: Spell): string {
  return description.replace(/[#$@](\d+)|%z/g, (match, number) => {
    if (match === "%z") {
      const minutes = (spell.buffduration ?? 0) / 10;
      return `${minutes.toFixed(1)} minutes`;
    }

    const index = parseInt(number, 10);
    switch (match[0]) {
      case "#": {
        const baseValue = Number(
          spell[`effect_base_value${index}` as keyof Spell]
        );
        const maxValue = Number(spell[`max${index}` as keyof Spell]);
        const formula = Number(spell[`formula${index}` as keyof Spell]);
        if (!isNaN(baseValue) && !isNaN(formula)) {
          const calculatedValue = calcSpellEffectValue(
            formula,
            baseValue,
            maxValue,
            1,
            spell,
            0
          );
          return Math.abs(calculatedValue).toString();
        }
        return match;
      }
      case "$": {
        const limitValue = spell[`effect_limit_value${index}` as keyof Spell];
        return limitValue?.toString() ?? match;
      }
      case "@": {
        const maxVal = Number(spell[`max${index}` as keyof Spell]);
        const baseVal = Number(
          spell[`effect_base_value${index}` as keyof Spell]
        );
        if (maxVal == 0) {
          return Math.abs(baseVal).toString();
        }
        return maxVal.toString();
      }
      default:
        return match;
    }
  });
}

// Convert service spell to entity spell format
function toEntitySpell(serviceSpell: ServiceSpell): Spell {
  return {
    id: serviceSpell.id,
    name: serviceSpell.name,
    buffduration: serviceSpell.buffduration ?? 0,
    effect_base_value1: serviceSpell.effectBaseValue1 ?? 0,
    effect_base_value2: serviceSpell.effectBaseValue2 ?? 0,
    effect_base_value3: serviceSpell.effectBaseValue3 ?? 0,
    effect_limit_value1: serviceSpell.effectLimitValue1 ?? 0,
    effect_limit_value2: serviceSpell.effectLimitValue2 ?? 0,
    effect_limit_value3: serviceSpell.effectLimitValue3 ?? 0,
    max1: serviceSpell.max1 ?? 0,
    max2: serviceSpell.max2 ?? 0,
    max3: serviceSpell.max3 ?? 0,
    formula1: serviceSpell.formula1 ?? 0,
    formula2: serviceSpell.formula2 ?? 0,
    formula3: serviceSpell.formula3 ?? 0,
    classes1: serviceSpell.classes1 ?? 255,
    classes2: serviceSpell.classes2 ?? 255,
    classes3: serviceSpell.classes3 ?? 255,
    classes4: serviceSpell.classes4 ?? 255,
    classes5: serviceSpell.classes5 ?? 255,
    classes6: serviceSpell.classes6 ?? 255,
    classes7: serviceSpell.classes7 ?? 255,
    classes8: serviceSpell.classes8 ?? 255,
    classes9: serviceSpell.classes9 ?? 255,
    classes10: serviceSpell.classes10 ?? 255,
    classes11: serviceSpell.classes11 ?? 255,
    classes12: serviceSpell.classes12 ?? 255,
    classes13: serviceSpell.classes13 ?? 255,
    classes14: serviceSpell.classes14 ?? 255,
    descnum: serviceSpell.descnum ?? 0,
  } as Spell;
}

export const useSpellInfo = (item: Item | null) => {
  const [spellInfo, setSpellInfo] = React.useState<SpellInfo | null>(null);

  React.useEffect(() => {
    const fetchSpellInfo = async () => {
      if (item && Number(item.itemtype) === 20 && item.scrolleffect) {
        try {
          const serviceSpell = await eqDataService.getSpellById(
            Number(item.scrolleffect)
          );

          if (serviceSpell) {
            const spell = toEntitySpell(serviceSpell);
            let description: string | null = null;

            // Spell descriptions are stored at spell_id + 40000 in eqstr_us
            const descriptionId = spell.id + 40000;
            const descriptionEntry = await eqDataService.getEqstrById(
              descriptionId
            );
            if (descriptionEntry) {
              description = processSpellDescription(
                descriptionEntry.text,
                spell
              );
            }

            setSpellInfo({ spell, description });
          } else {
            setSpellInfo(null);
          }
        } catch (error) {
          console.error("Error fetching spell info:", error);
          setSpellInfo(null);
        }
      } else {
        setSpellInfo(null);
      }
    };

    fetchSpellInfo();
  }, [item]);

  return spellInfo;
};

export const getSpellLevels = (spell: Spell) => {
  if (!spell) return "";
  const classesData = useStaticDataStore.getState().classes;
  const classes = classesData.slice(0, 14);
  const levels = classes
    .map((c, index) => {
      const classKey = `classes${index + 1}` as keyof Spell;
      const level = spell[classKey] as number;
      return level > 0 && level < 255
        ? { short_name: c.short_name, level }
        : null;
    })
    .filter(
      (item): item is { short_name: string; level: number } => item !== null
    )
    .sort((a, b) => a.level - b.level)
    .map((item) => `${item.short_name}(${item.level})`);

  return levels.length > 0 ? `Level Needed: ${levels.join(" ")}` : "";
};
