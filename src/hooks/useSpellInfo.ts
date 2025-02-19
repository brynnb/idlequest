import React from "react";
import { Item } from "@entities/Item";
import { Spell } from "@entities/Spell";
import { useDatabase } from "./useDatabase";
import classesData from "@data/json/classes.json";
import { calcSpellEffectValue } from "@utils/spellCalculations";

interface SpellInfo {
  spell: Spell;
  description: string | null;
}

type SpellTableKey = "spells" | "eqstr_us";

function processSpellDescription(description: string, spell: Spell): string {
  // console.log("Processing spell:", spell);
  return description.replace(/[#$@](\d+)|%z/g, (match, number) => {
    // console.log("Matching:", match, number);
    if (match === "%z") {
      const minutes = spell.buffduration / 10;
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
        // console.log(
        //   `#${index}: baseValue=${baseValue}, maxValue=${maxValue}, formula=${formula}`
        // );
        if (!isNaN(baseValue) && !isNaN(formula)) {
          const calculatedValue = calcSpellEffectValue(
            formula,
            baseValue,
            maxValue,
            1,
            spell,
            0
          );
          // console.log(`Calculated value for #${index}:`, calculatedValue);
          return Math.abs(calculatedValue).toString();
        }
        // console.warn(`Invalid effect_base_value${index} for spell:`, spell);
        return match;
      }
      case "$": {
        const limitValue = spell[`effect_limit_value${index}` as keyof Spell];
        // console.log(`$${index}: limitValue=${limitValue}`);
        return limitValue?.toString() ?? match;
      }
      case "@": {
        const maxVal = Number(spell[`max${index}` as keyof Spell]);
        const baseVal = Number(
          spell[`effect_base_value${index}` as keyof Spell]
        );
        // console.log(`@${index}: maxVal=${maxVal}, baseVal=${baseVal}`);
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

export const useSpellInfo = (item: Item | null) => {
  const { getById } = useDatabase();
  const [spellInfo, setSpellInfo] = React.useState<SpellInfo | null>(null);

  React.useEffect(() => {
    const fetchSpellInfo = async () => {
      if (item && Number(item.itemtype) === 20 && item.scrolleffect) {
        try {
          const spell = await getById(
            "spells" as SpellTableKey,
            Number(item.scrolleffect)
          );

          if (spell) {
            const descriptionEntry = await getById(
              "eqstr_us" as SpellTableKey,
              Number(spell.descnum)
            );
            let description = descriptionEntry ? descriptionEntry.text : null;

            if (description) {
              // console.log("Original description:", description);
              description = processSpellDescription(description, spell);
              // console.log("Processed description:", description);
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
  }, [item, getById]);

  return spellInfo;
};

export const getSpellLevels = (spell: Spell) => {
  if (!spell) return "";
  const classes = classesData.slice(0, 14);
  const levels = classes
    .map((c, index) => {
      const classKey = `classes${index + 1}` as keyof Spell;
      const level = spell[classKey] as number;
      return level > 0 && level < 255
        ? { shortName: c.short_name, level }
        : null;
    })
    .filter(
      (item): item is { shortName: string; level: number } => item !== null
    )
    .sort((a, b) => a.level - b.level)
    .map((item) => `${item.shortName}(${item.level})`);

  return levels.length > 0 ? `Level Needed: ${levels.join(" ")}` : "";
};
