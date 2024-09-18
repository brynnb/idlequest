import React from "react";
import { Item } from "../entities/Item";
import { ItemSize, getItemSizeName } from "../entities/ItemSize";
import { getInventorySlotNames } from "../entities/InventorySlot";
import { ItemType, getItemTypeName as getItemTypeNameFromEnum } from "../entities/ItemType";
import styles from "./ItemInformationDisplay.module.css";

interface ItemDisplayProps {
  item: Item | null;
  isVisible: boolean;
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ item, isVisible }) => {
  if (!item || !isVisible) return null;

  const getSlotNames = (slots: number | undefined) => {
    if (slots === undefined) return "NONE";
    const slotNames = getInventorySlotNames(slots);
    return slotNames.length > 0 ? slotNames.join("/") : "NONE";
  };

  const getItemTypeNameWrapper = (itemtype: number | undefined) => {
    if (itemtype === undefined) return "UNKNOWN";
    return getItemTypeNameFromEnum(itemtype as ItemType);
  };

  const getClassNames = (classes: number | undefined) => {
    // Implement the actual class mapping logic
    const classMap: { [key: number]: string } = {
      1: "WAR",
      2: "PLD",
      3: "SHD",
    };
    return Object.entries(classMap)
      .filter(([bit]) => classes && classes & (1 << (parseInt(bit) - 1)))
      .map(([, name]) => name)
      .join(" ");
  };

  const getRaceNames = (races: number | undefined) => {
    // Implement the actual race mapping logic
    return races === 65535 ? "ALL" : "SOME";
  };

  const getStatString = (item: Item) => {
    const stats = [
      item.astr !== undefined && `STR +${item.astr}`,
      item.awis !== undefined && `WIS +${item.awis}`,
      item.fr !== undefined && `SV FIRE +${item.fr}`,
      item.dr !== undefined && `SV DISEASE +${item.dr}`,
      item.cr !== undefined && `SV COLD +${item.cr}`,
      item.mr !== undefined && `SV MAGIC +${item.mr}`,
    ].filter(Boolean);

    // Split stats into two lines
    const midpoint = Math.ceil(stats.length / 2);
    return [
      stats.slice(0, midpoint).join(" "),
      stats.slice(midpoint).join(" "),
    ];
  };

  const statLines = getStatString(item);

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
        <p>Slot: {getSlotNames(item.slots)}</p>
        <p>
          Type: {getItemTypeNameWrapper(item.itemtype)} Atk Delay: {item.delay}
        </p>
        <p>DMG: {item.damage}</p>
        <p>{statLines[0]}</p>
        <p>{statLines[1]}</p>
        <p>
          WT: {(item.weight || 0) / 10} Size: {getItemSizeName(item.size as ItemSize)}
        </p>
        <p>Class: {getClassNames(item.classes)}</p>
        <p>Race: {getRaceNames(item.races)}</p>
      </div>
    </div>
  );
};

export default ItemDisplay;
