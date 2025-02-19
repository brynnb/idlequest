import React from "react";
import styled from "styled-components";
import { Item } from "@entities/Item";
import { ItemSize, getItemSizeName } from "@entities/ItemSize";
import { ItemClass } from "@entities/ItemClass";
import { useSpellInfo } from "@hooks/useSpellInfo";
import {
  getSlotNames,
  getClassNames,
  getRaceNames,
  getStatString,
  isEquippableItem,
  isSpellItem,
} from "@utils/itemUtils";
import WeaponStats from "@components/WeaponStats";
import SpellInfo from "@components/SpellInfo";

const ItemDisplayContainer = styled.div.attrs({
  className: "item-display-container",
})`
  width: 902px;
  height: 300px;
  left: 266px;
  top: 722px;
  padding-top: 40px;
  padding-bottom: 20px;
  position: absolute;
  background-image: url("/images/chatbginspect.png");
  background-size: cover;
  font-size: 20px;
  line-height: 1.2;
  display: flex;
  font-family: Arial, sans-serif;
  color: black;
  font-weight: bold;

  p {
    margin: 5px 0;
    font-size: 16px;
    line-height: 1.2;
    color: black;
    font-weight: 600;
  }
`;

const ItemDisplayContent = styled.div`
  position: absolute;
  top: 50px;
  left: 120px;
  right: 60px;
  bottom: 60px;
  overflow: auto;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

interface ItemDisplayProps {
  item: Item | null;
  isVisible: boolean;
}

const ItemDisplay: React.FC<ItemDisplayProps> = ({ item, isVisible }) => {
  const spellInfo = useSpellInfo(item);

  if (!item || !isVisible) return null;

  const weaponTypes = [0, 1, 2, 3, 4, 35, 45];
  const showWeaponStats =
    item.itemtype !== undefined && weaponTypes.includes(item.itemtype);

  const slotNames = getSlotNames(item.slots);

  const isEquippable = isEquippableItem(item);
  const isSpell = isSpellItem(item);

  const getItemFlags = (item: Item): string[] => {
    const flags: string[] = [];
    if (item.magic === 1) flags.push("MAGIC ITEM ");
    if (item.lore && item.lore.startsWith("*")) flags.push("LORE ITEM ");
    if (item.nodrop !== undefined && item.nodrop == 0) flags.push("NO DROP ");
    if (item.norent !== undefined && item.norent === 0) flags.push("NO RENT");
    return flags;
  };

  return (
    <ItemDisplayContainer>
      <ItemDisplayContent>
        <p>{item.name}</p>
        <p>{getItemFlags(item)}</p>
        {!isSpell && item.maxcharges !== undefined && item.maxcharges > 0 && 
         (item.clickeffect || item.scrolleffect || item.proceffect) && 
         <p>Charges: {item.maxcharges}</p>}
        {slotNames !== "NONE" && <p>Slot: {slotNames}</p>}
        {showWeaponStats && item.itemclass === ItemClass.COMMON_ITEM && (
          <WeaponStats item={item} />
        )}
        {item.ac !== undefined && item.ac !== 0 && <p>AC: {item.ac}</p>}
        <p>{getStatString(item)}</p>
        {item.itemclass === ItemClass.CONTAINER ? (
          <>
            <p>WT: {((item.weight || 0) / 10).toFixed(1)}</p>
            <p>
              {item.bagslots !== undefined && `Capacity: ${item.bagslots}  `}
              {item.bagsize !== undefined &&
                ` Size Capacity: ${getItemSizeName(item.bagsize as ItemSize)}`}
            </p>
          </>
        ) : (
          <p>
            WT: {((item.weight || 0) / 10).toFixed(1)} Size:{" "}
            {getItemSizeName(item.size as ItemSize)}
          </p>
        )}
        {(isEquippable || isSpell) && (
          <>
            <p>Class: {getClassNames(item.classes)}</p>
            <p>Race: {getRaceNames(item.races)}</p>
          </>
        )}
        
        {isSpell && spellInfo && <SpellInfo spellInfo={spellInfo} />}
      </ItemDisplayContent>
    </ItemDisplayContainer>
  );
};

export default ItemDisplay;
