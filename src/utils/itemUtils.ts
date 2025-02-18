import { Item } from "@entities/Item";
import {
  ItemType,
  getItemTypeName,
  EQUIPPABLE_ITEM_TYPES,
} from "@entities/ItemType";
import {
  InventorySlot,
  SlotBitmasks,
  getInventorySlotNames,
} from "@entities/InventorySlot";
import classesData from "@data/json/classes.json";
import racesData from "@data/json/races.json";
import Race from "@entities/Race";
import { InventoryItem } from "@entities/InventoryItem";
import CharacterClass from "@entities/CharacterClass";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import getItemScore from "./getItemScore";
import useChatStore, { MessageType } from "@stores/ChatStore";
import { getItemById } from "./databaseOperations";
import CharacterProfile from "@entities/CharacterProfile";
import { ItemSize } from "@entities/ItemSize";

export const getCharacterClass = (classId: number): CharacterClass | null => {
  const classData = classesData.find((c) => c.id === classId);
  if (!classData) return null;
  return classData as CharacterClass;
};

export const getCharacterRace = (raceId: number): Race | null => {
  const raceData = racesData.find((r) => r.id === raceId);
  if (!raceData) return null;
  return raceData as Race;
};

export const isSlotAvailableForItem = (
  item: InventoryItem,
  slot: InventorySlot,
  characterClass: CharacterClass,
  characterRace: Race,
  inventory: InventoryItem[]
): boolean => {
  // Allow cursor and general inventory slots
  if (slot === InventorySlot.Cursor) return true;
  if (slot >= 23 && slot <= 30) return true;

  // Prevent placing bags inside bags
  if (slot >= 262 && slot <= 351 && item.itemDetails?.itemclass === 1) {
    return false;
  }

  // Check size restrictions for bag slots
  if (slot >= 262 && slot <= 351) {
    const bagSlot = Math.floor((slot - 262) / 10) + 23;
    const bagItem = inventory.find((item) => item.slotid === bagSlot);

    if (
      bagItem?.itemDetails?.bagsize !== undefined &&
      item.itemDetails?.size !== undefined
    ) {
      const itemSize = item.itemDetails.size as ItemSize;
      const bagMaxSize = bagItem.itemDetails.bagsize as ItemSize;
      if (itemSize > bagMaxSize) {
        return false;
      }
    }
    return true;
  }

  if (!item.itemDetails || item.itemDetails.slots === undefined) {
    return false;
  }

  // Check if trying to equip in secondary slot while having a 2H weapon equipped
  if (slot === InventorySlot.Secondary) {
    const primaryItem = inventory.find(
      (item) => item.slotid === InventorySlot.Primary
    );
    if (
      primaryItem?.itemDetails?.itemtype !== undefined &&
      [1, 4, 35].includes(primaryItem.itemDetails.itemtype)
    ) {
      return false;
    }
  }

  // Check if trying to equip a 2H weapon in primary while having something in secondary
  if (
    slot === InventorySlot.Primary &&
    item.itemDetails?.itemtype !== undefined &&
    [1, 4, 35].includes(item.itemDetails.itemtype)
  ) {
    const secondaryItem = inventory.find(
      (item) => item.slotid === InventorySlot.Secondary
    );
    if (secondaryItem) {
      return false;
    }
  }

  const itemSlots = parseInt(item.itemDetails.slots.toString());
  const slotCheck = (itemSlots & SlotBitmasks[slot]) !== 0;
  const classCheck = isEquippableWithClass(item.itemDetails, characterClass);
  const raceCheck = isEquippableWithRace(item.itemDetails, characterRace);

  return slotCheck && classCheck && raceCheck;
};

export const isItemAllowedInSlot = (
  item: InventoryItem,
  slot: InventorySlot,
  characterClass: CharacterClass,
  characterRace: Race,
  inventory?: InventoryItem[]
): boolean => {
  return isSlotAvailableForItem(
    item,
    slot,
    characterClass,
    characterRace,
    inventory || []
  );
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
  const classesBitmask = parseInt(classes.toString());
  if (classesBitmask === 32767) return "ALL";

  const playableClasses = classesData.slice(0, 14);
  const classNames = playableClasses
    .filter(
      (classInfo) => classInfo.bitmask && classesBitmask & classInfo.bitmask
    )
    .map((classInfo) => classInfo.short_name);

  return classNames.length > 0 ? classNames.join(" ") : "NONE";
};

export const getRaceNames = (races: number | undefined) => {
  if (races === undefined) return "UNKNOWN";
  const racesBitmask = parseInt(races.toString());
  if (racesBitmask === 16383) return "ALL";

  const playableRaces = racesData.filter(
    (race) => race.is_playable && race.short_name && race.bitmask !== undefined
  );
  const raceNames = playableRaces
    .filter((race) => race.bitmask !== undefined && racesBitmask & race.bitmask)
    .map((race) => race.short_name)
    .filter((name): name is string => name !== undefined);

  return raceNames.length > 0 ? raceNames.join(" ") : "NONE";
};

export const getStatString = (item: Item) => {
  const stats = [
    item.astr && `STR +${item.astr}`,
    item.asta && `STA +${item.asta}`,
    item.aagi && `AGI +${item.aagi}`,
    item.adex && `DEX +${item.adex}`,
    item.awis && `WIS +${item.awis}`,
    item.aint && `INT +${item.aint}`,
    item.acha && `CHA +${item.acha}`,
    item.hp && `HP +${item.hp}`,
    item.mana && `MANA +${item.mana}`,
    item.endur && `ENDUR +${item.endur}`,
    item.fr && `FR +${item.fr}`,
    item.cr && `CR +${item.cr}`,
    item.dr && `DR +${item.dr}`,
    item.pr && `PR +${item.pr}`,
    item.mr && `MR +${item.mr}`,
    item.svcorruption && `SV CORRUPT +${item.svcorruption}`,
  ].filter(Boolean);
  return stats.join(" ");
};

export const isEquippableItem = (item: Item): boolean => {
  return (
    item.itemclass === 0 &&
    item.itemtype !== undefined &&
    EQUIPPABLE_ITEM_TYPES.includes(item.itemtype as ItemType)
  );
};

export const isSpellItem = (item: Item): boolean => {
  return item.itemtype === 20;
};

export const formatPrice = (copperPrice: number): string => {
  const platinum = Math.floor(copperPrice / 1000);
  const gold = Math.floor((copperPrice % 1000) / 100);
  const silver = Math.floor((copperPrice % 100) / 10);
  const copper = copperPrice % 10;

  return `${platinum}p ${gold}g ${silver}s ${copper}c`;
};

export const isEquippableWithClass = (
  item: Item,
  characterClass: CharacterClass
): boolean => {
  if (!item.classes || !characterClass.bitmask) {
    return false;
  }
  const itemClassesBitmask = parseInt(item.classes.toString());
  return (itemClassesBitmask & characterClass.bitmask) !== 0;
};

export const isEquippableWithRace = (
  item: Item,
  characterRace: Race
): boolean => {
  if (!item.races || !characterRace.bitmask) {
    return false;
  }
  const itemRacesBitmask = parseInt(item.races.toString());
  return (itemRacesBitmask & characterRace.bitmask) !== 0;
};

export const getEquippableSlots = (item: Item): number[] => {
  if (!item.slots) return [];
  const itemSlots = parseInt(item.slots.toString());
  return Object.entries(SlotBitmasks)
    .filter(
      ([slot, bitmask]) => (itemSlots & bitmask) !== 0 && parseInt(slot) < 23
    )
    .map(([slot]) => parseInt(slot));
};

export const findFirstAvailableGeneralSlot = (
  inventory: InventoryItem[]
): number | undefined => {
  // Check base slots (23 to 30)
  for (let slot = 23; slot <= 30; slot++) {
    if (!inventory.some((item) => item.slotid === slot)) {
      return slot;
    }
  }

  // Check bag slots
  for (let baseSlot = 23; baseSlot <= 30; baseSlot++) {
    const bagItem = inventory.find(
      (item) => item.slotid === baseSlot && item.itemDetails?.bagslots
    );
    if (bagItem?.itemDetails?.bagslots) {
      const bagSize = bagItem.itemDetails.bagslots;
      const bagStartSlot = getBagStartingSlot(baseSlot);
      for (let i = 0; i < bagSize; i++) {
        const bagSlot = bagStartSlot + i;
        const itemInSlot = inventory.find((item) => item.slotid === bagSlot);
        if (!itemInSlot) {
          return bagSlot;
        }
      }
    }
  }

  return undefined;
};

export const findFirstAvailableSlotForItem = (
  inventory: InventoryItem[],
  item: InventoryItem
): number | undefined => {
  // Check base slots (23 to 30)
  for (let slot = 23; slot <= 30; slot++) {
    if (!inventory.some((invItem) => invItem.slotid === slot)) {
      return slot;
    }
  }

  // Check bag slots
  for (let baseSlot = 23; baseSlot <= 30; baseSlot++) {
    const bagItem = inventory.find(
      (invItem) => invItem.slotid === baseSlot && invItem.itemDetails?.bagslots
    );
    if (bagItem?.itemDetails?.bagslots) {
      const bagSize = bagItem.itemDetails.bagslots;
      const bagStartSlot = getBagStartingSlot(baseSlot);
      for (let i = 0; i < bagSize; i++) {
        const bagSlot = bagStartSlot + i;
        const itemInSlot = inventory.find(
          (invItem) => invItem.slotid === bagSlot
        );
        if (
          !itemInSlot &&
          isItemAllowedInSlot(
            item,
            bagSlot as InventorySlot,
            { id: 1, bitmask: 1 } as CharacterClass, // These don't matter for bag slots
            { id: 1, bitmask: 1 } as Race, // These don't matter for bag slots
            inventory
          )
        ) {
          return bagSlot;
        }
      }
    }
  }

  return undefined;
};

export const getBagStartingSlot = (baseSlot: number): number => {
  switch (baseSlot) {
    case InventorySlot.Cursor:
      return InventorySlot.CursorBagStartingSlot; // Should be 342
    case 23:
      return InventorySlot.General1BagStartingSlot;
    case 24:
      return InventorySlot.General2BagStartingSlot;
    case 25:
      return InventorySlot.General3BagStartingSlot;
    case 26:
      return InventorySlot.General4BagStartingSlot;
    case 27:
      return InventorySlot.General5BagStartingSlot;
    case 28:
      return InventorySlot.General6BagStartingSlot;
    case 29:
      return InventorySlot.General7BagStartingSlot;
    case 30:
      return InventorySlot.General8BagStartingSlot;
    default:
      return -1;
  }
};

export const handleEquipAllItems = () => {
  const { characterProfile, setInventory } = usePlayerCharacterStore.getState();
  const newInventory = [...characterProfile.inventory];

  const generalItems = newInventory.filter(
    (item) => item.slotid && item.slotid > 22
  );

  for (const inventoryItem of generalItems) {
    const itemDetails = inventoryItem.itemDetails;

    if (itemDetails && itemDetails.slots !== undefined) {
      const possibleSlots = getInventorySlotNames(itemDetails.slots);

      for (const slotName of possibleSlots) {
        const slotEntry = Object.entries(InventorySlot).find(
          ([key, value]) => key.replace(/\d+/g, "").toUpperCase() === slotName
        );

        if (slotEntry) {
          const slotId = parseInt(slotEntry[1].toString());
          if (slotId >= 0 && slotId <= 22) {
            const isSlotEmpty = !newInventory.some(
              (invItem) => invItem.slotid === slotId
            );

            if (isSlotEmpty) {
              inventoryItem.slotid = slotId;
              break;
            }
          }
        }
      }
    }
  }

  setInventory(newInventory);
};

export const addItemToInventoryByItemId = async (itemId: number) => {
  const { characterProfile, addInventoryItem } =
    usePlayerCharacterStore.getState();
  const itemDetails = await getItemById(itemId);

  if (!itemDetails) {
    console.error(`Failed to fetch item details for item ID: ${itemId}`);
    return;
  }

  const generalSlot = findFirstAvailableGeneralSlot(
    characterProfile.inventory || []
  );
  if (generalSlot === undefined) {
    console.warn("No available slots for new item");
    return;
  }

  const newItem = {
    itemid: itemId,
    slotid: generalSlot,
    charges: 1,
    itemDetails,
  };

  await addInventoryItem(newItem);
};
