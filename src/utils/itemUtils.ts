import { Item } from "../entities/Item";
import {
  ItemType,
  getItemTypeName,
  EQUIPPABLE_ITEM_TYPES,
} from "../entities/ItemType";
import { InventorySlot, SlotBitmasks, getInventorySlotNames } from "../entities/InventorySlot";
import classesData from "/data/classes.json";
import racesData from "/data/races.json";
import Race from "../entities/Race";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import { InventoryItem } from "../entities/InventoryItem";

export const handleItemClick = (slotId: InventorySlot) => {
  const { characterProfile, swapItems, moveItemToSlot } =
    usePlayerCharacterStore.getState();

  const getInventoryItemForSlot = (slot: InventorySlot) => {
    return characterProfile?.inventory?.find((item) => item.slotid === slot);
  };

  const cursorItem = getInventoryItemForSlot(InventorySlot.Cursor);
  const currentSlotItem = getInventoryItemForSlot(slotId);

  const isItemAllowedInSlot = (item: InventoryItem, slot: InventorySlot) => {
    if (slot === InventorySlot.Cursor || slot >= 23) return true;
    if (!item.itemDetails || item.itemDetails.slots === undefined) return false;
    const itemSlots = parseInt(item.itemDetails.slots);
    return (itemSlots & SlotBitmasks[slot]) !== 0;
  };

  if (currentSlotItem && cursorItem) {
    if (isItemAllowedInSlot(cursorItem, slotId)) {
      swapItems(currentSlotItem.slotid, cursorItem.slotid);
    }
  } else if (cursorItem) {
    if (isItemAllowedInSlot(cursorItem, slotId)) {
      moveItemToSlot(InventorySlot.Cursor, slotId);
    }
  } else if (currentSlotItem) {
    moveItemToSlot(slotId, InventorySlot.Cursor);
  }
};

export const getSlotNames = (slots: number | undefined) => {
  if (slots === undefined) return "NONE";
  const slotNames = getInventorySlotNames(slots);
  return slotNames.length > 0 ? slotNames.join(" ") : "NONE";
};

export const getItemTypeNameWrapper = (itemtype: string | undefined) => {
  if (itemtype === undefined) return "UNKNOWN";
  return getItemTypeName(parseInt(itemtype) as ItemType);
};

export const getClassNames = (classes: number | undefined) => {
  if (classes === undefined) return "UNKNOWN";
  if (classes === 32767) return "ALL";

  const playableClasses = classesData.slice(0, 14);
  const classNames = playableClasses
    .filter((classInfo) => classInfo.bitmask && classes & classInfo.bitmask)
    .map((classInfo) => classInfo.short_name);

  return classNames.length > 0 ? classNames.join(" ") : "NONE";
};

export const getRaceNames = (races: number | undefined) => {
  if (races === undefined) return "UNKNOWN";
  if (races === 16383) return "ALL";

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

export const getStatString = (item: Item) => {
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
};

export const isEquippableItem = (item: Item): boolean => {
  return (
    item.itemclass === "0" &&
    EQUIPPABLE_ITEM_TYPES.includes(Number(item.itemtype) as ItemType)
  );
};

export const isSpellItem = (item: Item): boolean => {
  return item.itemtype === "20";
};
