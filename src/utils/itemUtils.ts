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
    return (
      (itemSlots & SlotBitmasks[slot]) !== 0 &&
      isEquippableWithClass(item.itemDetails, characterProfile.class) &&
      isEquippableWithRace(item.itemDetails, characterProfile.race)
    );
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

  usePlayerCharacterStore.getState().updateArmorClass();
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
  const { addInventoryItem, characterProfile, removeInventoryItem, setInventory } =
    usePlayerCharacterStore.getState();
  const addChatMessage = useChatStore.getState().addMessage;

  let updatedInventory = [...characterProfile.inventory];

  loot.forEach((item) => {
    if (!item) {
      console.error("Encountered undefined item in loot");
      return;
    }

    if (
      isEquippableItem(item) &&
      isEquippableWithClass(item, characterProfile.class) &&
      isEquippableWithRace(item, characterProfile.race)
    ) {
      const itemSlots = parseInt(item.slots);
      const availableSlot = Object.entries(SlotBitmasks).find(
        ([slot, bitmask]) => {
          const slotId = parseInt(slot);
          if (slotId >= 23 || (itemSlots & bitmask) === 0) return false;

          const existingItem = characterProfile.inventory.find(
            (invItem) => invItem.slotid === slotId
          );

          if (!existingItem) {
            const charClass = characterProfile.class;
            const newItemScore = getItemScore(item, charClass);
            console.log(
              `New item to equip for ${InventorySlot[slotId]}:`,
              item.name,
              "Score:",
              newItemScore
            );
            return true;
          }

          const charClass = characterProfile.class;
          const newItemScore = getItemScore(item, charClass);
          const existingItemScore = getItemScore(
            existingItem.itemDetails,
            charClass
          );

          return newItemScore > existingItemScore;
        }
      );

      if (availableSlot) {
        const slotId = parseInt(availableSlot[0]);
        const existingItem = characterProfile.inventory.find(
          (invItem) => invItem.slotid === slotId
        );
        const charClass = characterProfile.class;
        const newItemScore = getItemScore(item, charClass);

        if (existingItem && existingItem.itemDetails) {
          const existingItemScore = getItemScore(
            existingItem.itemDetails,
            charClass
          );
          console.log("Upgrade found:");
          console.log(
            "Old item:",
            existingItem.itemDetails.name,
            "Score:",
            existingItemScore
          );
          console.log("New item:", item.name, "Score:", newItemScore);

          removeInventoryItem(existingItem.slotid);
          const firstAvailableSlot = Array.from(
            { length: 8 },
            (_, i) => i + 23
          ).find(
            (slot) =>
              !characterProfile.inventory.some(
                (invItem) => invItem.slotid === slot
              )
          );

          if (firstAvailableSlot !== undefined) {
            addInventoryItem({
              ...existingItem,
              slotid: firstAvailableSlot,
            });
          } else {
            //make sure we remove item from inventory
            addChatMessage(
              `Inventory full, item dropped: ${existingItem.itemDetails.name}`,
              MessageType.LOOT
            );
          }
        }

        addInventoryItem({
          itemid: item.id,
          slotid: slotId,
          charges: 1,
          itemDetails: item,
        });
        return;
      }
    }

    // If not equippable or no available equipment slot, add to general inventory
    const firstAvailableSlot = Array.from({ length: 8 }, (_, i) => i + 23).find(
      (slot) =>
        !updatedInventory.some((invItem) => invItem.slotid === slot)
    );

    if (firstAvailableSlot !== undefined) {
      const newItem = {
        itemid: item.id,
        slotid: firstAvailableSlot,
        charges: 1,
        itemDetails: item,
      };
      updatedInventory.push(newItem);
      addInventoryItem(newItem);
    } else {
      addChatMessage(
        `Inventory full, item dropped: ${item.name}`,
        MessageType.LOOT
      );
    }
  });

  setInventory(updatedInventory);
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

export const handleSellGeneralInventory = () => {
  const { characterProfile, removeInventoryItem } =
    usePlayerCharacterStore.getState();
  let totalCopper = 0;
  const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];

  characterProfile?.inventory?.forEach((item) => {
    if (generalSlots.includes(item.slotid) && item.itemDetails) {
      if (isSellable(item.itemDetails)) {
        totalCopper += Math.floor(item.itemDetails.price);
        removeInventoryItem(item.slotid);
      }
    }
  });

  const platinum = Math.floor(totalCopper / 1000);
  const gold = Math.floor((totalCopper % 1000) / 100);
  const silver = Math.floor((totalCopper % 100) / 10);
  const copper = totalCopper % 10;

  usePlayerCharacterStore.setState((state) => {
    let newCopper = (state.characterProfile.copper || 0) + copper;
    let newSilver = (state.characterProfile.silver || 0) + silver;
    let newGold = (state.characterProfile.gold || 0) + gold;
    let newPlatinum = (state.characterProfile.platinum || 0) + platinum;

    newSilver += Math.floor(newCopper / 10);
    newCopper = newCopper % 10;

    return {
      characterProfile: {
        ...state.characterProfile,
        platinum: newPlatinum,
        gold: newGold,
        silver: newSilver,
        copper: newCopper,
      },
    };
  });

  console.log(`Sold items for ${platinum}p ${gold}g ${silver}s ${copper}c`);
};

const isSellable = (item: Item): boolean => {
  return item.nodrop != 0 && item.norent != 0;
};