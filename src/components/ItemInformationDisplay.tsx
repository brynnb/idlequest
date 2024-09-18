import React from "react";
import { Item } from "../entities/Item";
import { ItemSize, getItemSizeName } from "../entities/ItemSize";
import { getInventorySlotNames } from "../entities/InventorySlot";
import { ItemType, getItemTypeName } from "../entities/ItemType";
import classesData from "/data/classes.json";
import styles from "./ItemInformationDisplay.module.css";
import racesData from "/data/races.json";
import Race from "../entities/Race";
import { useDatabase } from "../hooks/useDatabase";

interface ItemDisplayProps {
  item: Item | null;
  isVisible: boolean;
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ item, isVisible }) => {
  const { getById } = useDatabase();
  const [spellInfo, setSpellInfo] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchSpellInfo = async () => {
      if (item && item.itemtype === "20" && item.scrolleffect) {
        const spell = await getById("spells", Number(item.scrolleffect));
        if (spell) {
          const description = await getById("eqstr_us", Number(spell.descnum));
          setSpellInfo({ spell, description: description?.value });
        }
      }
    };

    fetchSpellInfo();
  }, [item, getById]);

  if (!item || !isVisible) return null;

  const weaponTypes = ['0', '1', '2', '3', '4', '35', '45'];
  const showWeaponStats = weaponTypes.includes(item.itemtype as string);

  const getSlotNames = (slots: number | undefined) => {
    if (slots === undefined) return "NONE";
    const slotNames = getInventorySlotNames(slots);
    return slotNames.length > 0 ? slotNames.join(" ") : "NONE";
  };

  const getItemTypeNameWrapper = (itemtype: string | undefined) => {
    if (itemtype === undefined) return "UNKNOWN";
    return getItemTypeName(parseInt(itemtype) as ItemType);
  };

  const getClassNames = (classes: number | undefined) => {
    if (classes === undefined) return "UNKNOWN";
    if (classes === "32767") return "ALL"; // 32767 is the bitmask for all classes

    const playableClasses = classesData.slice(0, 14); // Get only the first 14 classes
    const classNames = playableClasses
      .filter((classInfo) => classInfo.bitmask && classes & classInfo.bitmask)
      .map((classInfo) => classInfo.short_name);

    return classNames.length > 0 ? classNames.join(" ") : "NONE";
  };

  const getRaceNames = (races: number | undefined) => {
    if (races === undefined) return "UNKNOWN";
    if (races === "16383") return "ALL"; //16383  the value for all races

    const playableRaces = racesData.filter(
      (race: Race) =>
        race.is_playable && race.short_name && race.bitmask !== undefined
    );
    const raceNames = playableRaces
      .filter((race) => race.bitmask !== undefined && races & race.bitmask)
      .map((race) => race.short_name)
      .filter((name): name is string => name !== undefined);

    return raceNames.length > 0 ? raceNames.join(" ") : "NONE";
  };

  const getStatString = (item: Item) => {
    const stats = [
      parseInt(item.astr as string) && `STR +${item.astr}`,
      parseInt(item.asta as string) && `STA +${item.asta}`,
      parseInt(item.aagi as string) && `AGI +${item.aagi}`,
      parseInt(item.adex as string) && `DEX +${item.adex}`,
      parseInt(item.awis as string) && `WIS +${item.awis}`,
      parseInt(item.aint as string) && `INT +${item.aint}`,
      parseInt(item.acha as string) && `CHA +${item.acha}`,
      parseInt(item.ac as string) && `AC +${item.ac}`,
      parseInt(item.hp as string) && `HP +${item.hp}`,
      parseInt(item.mana as string) && `MANA +${item.mana}`,
      parseInt(item.endur as string) && `ENDUR +${item.endur}`,
      parseInt(item.fr as string) && `FR +${item.fr}`,
      parseInt(item.cr as string) && `CR +${item.cr}`,
      parseInt(item.dr as string) && `DR +${item.dr}`,
      parseInt(item.pr as string) && `PR +${item.pr}`,
      parseInt(item.mr as string) && `MR +${item.mr}`,
      parseInt(item.svcorrup as string) && `SV CORRUPT +${item.svcorrup}`,
    ].filter(Boolean);
    return stats.join(" ");

    // Split stats into two lines
    const midpoint = Math.ceil(stats.length / 2);
    return [
      stats.slice(0, midpoint).join(" "),
      stats.slice(midpoint).join(" "),
    ];
  };

  const getSpellLevels = (spell: any) => {
    if (!spell) return "";
    const classes = classesData.slice(0, 14); // Get first 14 classes bc we don't want non-classic / kunark ones
    const levels = classes
      .map((c, index) => {
        const level = spell[`classes${index + 1}`];
        return level > 0 && level < 255 ? { shortName: c.short_name, level } : null;
      })
      .filter((item): item is { shortName: string; level: number } => item !== null)
      .sort((a, b) => a.level - b.level)
      .map(item => `${item.shortName}(${item.level})`);

    return levels.length > 0 ? `Level Needed: ${levels.join(" ")}` : "";
  };

  const slotNames = getSlotNames(item.slots);

  return (
    <div className={styles.itemDisplay}>
      <div className={styles.itemDisplayContent}>
        <p>{item.name}</p>
        <p>
          {/* original database annoyingly doesnt consistently use 0 and 1 for false or true, it's all over the place*/}
          {item.magic === 1 && "MAGIC ITEM "}
          {/* -1 is standard lore, 0 is not lore, greater than 0 is a lore group */}
          {item.loregroup !== 0 && "LORE ITEM "}
          {item.nodrop < 1 && "NO DROP "}
          {item.norent === 0 && "NO RENT "}
        </p>
        {slotNames !== "NONE" && <p>Slot: {slotNames}</p>}
        {showWeaponStats && (
          <p>
            Type: {getItemTypeNameWrapper(item.itemtype)} Atk Delay: {item.delay}
          </p>
        )}
        {showWeaponStats && <p>DMG: {item.damage}</p>}
        <p>{getStatString(item)}</p>

        <p>
          WT: {(item.weight || 0) / 10} Size:{" "}
          {getItemSizeName(item.size as ItemSize)}
        </p>
        <p>Class: {getClassNames(item.classes)}</p>
        <p>Race: {getRaceNames(item.races)}</p>
        
        {item.itemtype === "20" && spellInfo && (
          <>
            <p>{getSpellLevels(spellInfo.spell)}</p>
            <p>{spellInfo.description}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ItemDisplay;
