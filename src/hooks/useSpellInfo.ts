import React from "react";
import { Item } from "../entities/Item";
import { useDatabase } from "./useDatabase";
import classesData from "/data/classes.json";
interface SpellInfo {
  spell: any;
  description: string | null;
}

export const useSpellInfo = (item: Item | null) => {
  const { getById } = useDatabase();
  const [spellInfo, setSpellInfo] = React.useState<SpellInfo | null>(null);

  React.useEffect(() => {
    const fetchSpellInfo = async () => {
      if (item && item.itemtype === "20" && item.scrolleffect) {
        try {
          const spell = await getById("spells", Number(item.scrolleffect));

          if (spell) {
            const descriptionEntry = await getById(
              "eqstr_us",
              Number(spell.descnum)
            );
            const description = descriptionEntry ? descriptionEntry.text : null;

            setSpellInfo({ spell, description });
          } else {
            setSpellInfo(null);
          }
        } catch (error) {
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

export const getSpellLevels = (spell: any) => {
  if (!spell) return "";
  const classes = classesData.slice(0, 14);
  const levels = classes
    .map((c, index) => {
      const level = spell[`classes${index + 1}`];
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
