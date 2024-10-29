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
import classesData from "/data/classes.json";
import racesData from "/data/races.json";
import Race from "@entities/Race";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { InventoryItem } from "@entities/InventoryItem";
import getItemScore from "./getItemScore";
import { CharacterClass } from "@entities/CharacterClass";
import useChatStore, { MessageType } from "@stores/ChatStore";
import { getItemById } from "./databaseOperations";

export const isItemAllowedInSlot = (
  item: InventoryItem,
  slot: InventorySlot,
  characterClass: CharacterClass,
  characterRace: Race
): boolean => {
  if (slot === InventorySlot.Cursor) return true;
  if (slot >= 23 && slot <= 30) return true;
  if (slot >= 262 && slot <= 351) return true;

  if (!item.itemDetails || item.itemDetails.slots === undefined) return false;
  const itemSlots = parseInt(item.itemDetails.slots);
  return (
    (itemSlots & SlotBitmasks[slot]) !== 0 &&
    isEquippableWithClass(item.itemDetails, characterClass) &&
    isEquippableWithRace(item.itemDetails, characterRace)
  );
};

export const handleItemClick = (slotId: InventorySlot) => {
  const { characterProfile, swapItems, moveItemToSlot } =
    usePlayerCharacterStore.getState();

  const getInventoryItemForSlot = (slot: InventorySlot) => {
    return characterProfile?.inventory?.find((item) => item.slotid === slot);
  };

  const cursorItem = getInventoryItemForSlot(InventorySlot.Cursor);
  const currentSlotItem = getInventoryItemForSlot(slotId);

  if (cursorItem) {
    if (
      isItemAllowedInSlot(
        cursorItem,
        slotId,
        characterProfile.class,
        characterProfile.race
      )
    ) {
      if (currentSlotItem) {
        console.log(`Swapping items`);

        swapItems(InventorySlot.Cursor, slotId);
      } else {
        console.log(`Moving item`);
        moveItemToSlot(cursorItem.slotid, slotId );
      }
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
  if (!item.classes || !characterClass.bitmask) return false;
  return (parseInt(item.classes.toString()) & characterClass.bitmask) !== 0;
};

export const isEquippableWithRace = (
  item: Item,
  characterRace: Race
): boolean => {
  if (!item.races || !characterRace.bitmask) return false;
  return (parseInt(item.races.toString()) & characterRace.bitmask) !== 0;
};

export const handleLoot = (loot: Item[]) => {
  const addChatMessage = useChatStore.getState().addMessage;

  loot.forEach((item) => {
    if (!item) {
      console.error("Encountered undefined item in loot");
      return;
    }

    addItemToInventory(item);
  });
};

export const addItemToInventory = async (item: Item) => {
  const {
    addInventoryItem,
    characterProfile,
    removeInventoryItem,
    setInventory,
  } = usePlayerCharacterStore.getState();
  const addChatMessage = useChatStore.getState().addMessage;

  let updatedInventory = [...characterProfile.inventory];

  const itemDetails = await getItemById(item.id);
  if (!itemDetails) {
    console.error(`Failed to fetch item details for item ID: ${item.id}`);
    return;
  }

  if (
    isEquippableItem(itemDetails) &&
    isEquippableWithClass(itemDetails, characterProfile.class) &&
    isEquippableWithRace(itemDetails, characterProfile.race)
  ) {
    const equippableSlots = getEquippableSlots(itemDetails);
    let bestSlotToReplace: number | null = null;
    let maxScoreDifference = -Infinity;

    for (const slot of equippableSlots) {
      const existingItem = characterProfile.inventory.find(
        (invItem) => invItem.slotid === slot
      );
      const newItemScore = getItemScore(itemDetails, characterProfile.class);
      const existingItemScore = existingItem
        ? getItemScore(existingItem.itemDetails, characterProfile.class)
        : 0;
      const scoreDifference = newItemScore - existingItemScore;

      if (scoreDifference > maxScoreDifference) {
        maxScoreDifference = scoreDifference;
        bestSlotToReplace = slot;
      }
    }

    if (bestSlotToReplace !== null && maxScoreDifference > 0) {
      const existingItem = characterProfile.inventory.find(
        (invItem) => invItem.slotid === bestSlotToReplace
      );
      if (existingItem) {
        const generalSlot = findFirstAvailableGeneralSlot(updatedInventory);
        if (generalSlot !== undefined) {
          updatedInventory = updatedInventory.map((invItem) =>
            invItem.slotid === bestSlotToReplace
              ? { ...invItem, slotid: generalSlot }
              : invItem
          );
        } else {
          addChatMessage(
            `Inventory full, item dropped: ${existingItem.itemDetails.Name}`,
            MessageType.LOOT
          );
          updatedInventory = updatedInventory.filter(
            (invItem) => invItem.slotid !== bestSlotToReplace
          );
        }
      }

      addInventoryItem({
        itemid: item.id,
        slotid: bestSlotToReplace,
        charges: 1,
        itemDetails: itemDetails,
      });
      return;
    }
  }

  // If not equippable or no better slot found, add to general inventory
  const generalSlot = findFirstAvailableGeneralSlot(updatedInventory);

  if (generalSlot !== undefined) {
    const newItem = {
      itemid: item.id,
      slotid: generalSlot,
      charges: 1,
      itemDetails: itemDetails,
    };
    updatedInventory.push(newItem);
    addInventoryItem(newItem);
  } else {
    addChatMessage(
      `Inventory full, item dropped: ${itemDetails.Name}`,
      MessageType.LOOT
    );
  }

  setInventory(updatedInventory);
};

const getEquippableSlots = (item: Item): number[] => {
  if (!item.slots) return [];
  const itemSlots = parseInt(item.slots.toString());
  return Object.entries(SlotBitmasks)
    .filter(
      ([slot, bitmask]) => (itemSlots & bitmask) !== 0 && parseInt(slot) < 23
    )
    .map(([slot]) => parseInt(slot));
};

const findFirstAvailableGeneralSlot = (
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
    if (bagItem) {
      const bagSize = bagItem.itemDetails.bagslots;
      const bagStartSlot = getBagStartingSlot(baseSlot);
      for (let i = 0; i < bagSize; i++) {
        const bagSlot = bagStartSlot + i;
        if (!inventory.some((item) => item.slotid === bagSlot)) {
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
        const slotId = Object.entries(InventorySlot).find(
          ([key, value]) => key.replace(/\d+/g, "").toUpperCase() === slotName
        )?.[1];

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

  const generalSlot = findFirstAvailableGeneralSlot(characterProfile.inventory);
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
