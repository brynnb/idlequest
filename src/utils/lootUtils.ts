import { Item } from "@entities/Item";
import { InventoryItem } from "@entities/InventoryItem";
import { getItemById } from "@utils/databaseOperations";
import {
  findFirstAvailableGeneralSlot,
  isEquippableItem,
  isEquippableWithClass,
  isEquippableWithRace,
  getEquippableSlots,
} from "@utils/itemUtils";
import getItemScore from "@utils/getItemScore";
import CharacterClass from "@entities/CharacterClass";
import Race from "@entities/Race";
import { MessageType } from "@stores/ChatStore";

interface LootHandlerDependencies {
  addInventoryItem?: (item: InventoryItem, itemDetails: Item) => Promise<void>;
  setInventory: (inventory: InventoryItem[]) => void;
  addChatMessage: (message: string, type: MessageType) => void;
  sellItem?: (item: Item) => void;
  autoSellEnabled?: boolean;
}

export const addItemToInventory = async (
  item: Item,
  characterProfile: {
    inventory?: InventoryItem[];
    class?: number;
    race?: number;
  },
  deps: LootHandlerDependencies
) => {
  const { setInventory, addChatMessage, sellItem, autoSellEnabled } = deps;
  let updatedInventory = [...(characterProfile.inventory || [])];

  if (!item.id) {
    console.error("Encountered item without ID");
    return;
  }

  const itemDetails = await getItemById(item.id);
  if (!itemDetails) {
    console.error(`Failed to fetch item details for item ID: ${item.id}`);
    return;
  }

  console.log(`Processing loot item: ${itemDetails.name} (ID: ${item.id})`);

  // Step 2: Check if item can be equipped and if there are empty equipment slots
  if (
    isEquippableItem(itemDetails) &&
    characterProfile.class &&
    characterProfile.race &&
    isEquippableWithClass(itemDetails, {
      id: characterProfile.class,
      bitmask: 1,
    } as CharacterClass) &&
    isEquippableWithRace(itemDetails, {
      id: characterProfile.race,
      bitmask: 1,
    } as Race)
  ) {
    console.log(`${itemDetails.name} is equippable by current character`);
    const equippableSlots = getEquippableSlots(itemDetails);
    console.log(`Possible equipment slots: ${equippableSlots.join(", ")}`);

    // First check for empty equipment slots
    for (const slot of equippableSlots) {
      const existingItem = updatedInventory.find(
        (invItem) => invItem.slotid === slot
      );

      if (!existingItem) {
        console.log(
          `Found empty equipment slot ${slot}, equipping ${itemDetails.name}`
        );
        const newItem = {
          itemid: item.id,
          slotid: slot,
          charges: 1,
          itemDetails,
        };
        updatedInventory.push(newItem);
        setInventory(updatedInventory);
        return;
      }
    }

    // Step 3: Check if item is an upgrade for any equipped slots
    let bestSlotToReplace: number | null = null;
    let maxScoreDifference = -Infinity;
    let itemToReplace: InventoryItem | null = null;

    for (const slot of equippableSlots) {
      const existingItem = updatedInventory.find(
        (invItem) => invItem.slotid === slot
      );

      if (existingItem?.itemDetails) {
        const newItemScore = getItemScore(itemDetails, {
          id: characterProfile.class,
          bitmask: 1,
        } as CharacterClass);
        const existingItemScore = getItemScore(existingItem.itemDetails, {
          id: characterProfile.class,
          bitmask: 1,
        } as CharacterClass);
        const scoreDifference = newItemScore - existingItemScore;

        console.log(
          `Comparing ${itemDetails.name} (score: ${newItemScore}) with ${existingItem.itemDetails.name} (score: ${existingItemScore}) in slot ${slot}`
        );

        if (scoreDifference > maxScoreDifference) {
          maxScoreDifference = scoreDifference;
          bestSlotToReplace = slot;
          itemToReplace = existingItem;
          console.log(
            `Found better upgrade candidate: +${scoreDifference} score improvement in slot ${slot}`
          );
        }
      }
    }

    if (
      bestSlotToReplace !== null &&
      maxScoreDifference > 0 &&
      itemToReplace?.itemDetails
    ) {
      console.log(
        `${itemDetails.name} is an upgrade over ${itemToReplace.itemDetails.name} in slot ${bestSlotToReplace}`
      );
      // Move existing item to general inventory first
      const generalSlot = findFirstAvailableGeneralSlot(updatedInventory);
      if (generalSlot !== undefined) {
        console.log(
          `Moving ${itemToReplace.itemDetails.name} to general inventory slot ${generalSlot}`
        );
        // Add the old item to general inventory
        const movedItem = {
          ...itemToReplace,
          slotid: generalSlot,
        };
        updatedInventory = updatedInventory.filter(
          (item) => item.slotid !== itemToReplace?.slotid
        );
        updatedInventory.push(movedItem);

        console.log(
          `Equipping ${itemDetails.name} in slot ${bestSlotToReplace}`
        );
        // Equip the new item
        const newItem = {
          itemid: item.id,
          slotid: bestSlotToReplace,
          charges: 1,
          itemDetails,
        };
        updatedInventory.push(newItem);
        setInventory(updatedInventory);
        return;
      } else if (autoSellEnabled && sellItem) {
        console.log(
          `Inventory full and auto-sell enabled, selling ${itemToReplace.itemDetails.name}`
        );
        sellItem(itemToReplace.itemDetails);
        updatedInventory = updatedInventory.filter(
          (invItem) => invItem.slotid !== bestSlotToReplace
        );
      } else {
        console.log(
          `Inventory full and auto-sell disabled, dropping ${itemToReplace.itemDetails.name}`
        );
        addChatMessage(
          `Inventory full, item dropped: ${itemToReplace.itemDetails.name}`,
          MessageType.LOOT
        );
        updatedInventory = updatedInventory.filter(
          (invItem) => invItem.slotid !== bestSlotToReplace
        );
      }
    } else {
      console.log(
        `${itemDetails.name} is not an upgrade for any equipped slots`
      );
    }
  } else {
    console.log(`${itemDetails.name} is not equippable by current character`);
  }

  // Step 4: If not equipped or an upgrade, try to find general inventory slot
  const generalSlot = findFirstAvailableGeneralSlot(updatedInventory);
  if (generalSlot !== undefined) {
    console.log(
      `Adding ${itemDetails.name} to general inventory slot ${generalSlot}`
    );
    const newItem = {
      itemid: item.id,
      slotid: generalSlot,
      charges: 1,
      itemDetails,
    };
    updatedInventory.push(newItem);
    setInventory(updatedInventory);
  } else if (autoSellEnabled && sellItem) {
    console.log(
      `Inventory full and auto-sell enabled, selling ${itemDetails.name}`
    );
    sellItem(itemDetails);
  } else {
    console.log(
      `Inventory full and auto-sell disabled, dropping ${itemDetails.name}`
    );
    addChatMessage(
      `Inventory full, item dropped: ${itemDetails.name}`,
      MessageType.LOOT
    );
  }
};

export const processLootItems = async (
  loot: Item[],
  characterProfile: {
    inventory?: InventoryItem[];
    class?: number;
    race?: number;
  },
  deps: LootHandlerDependencies
) => {
  console.log(`Processing ${loot.length} loot items`);
  let currentInventory = [...(characterProfile.inventory || [])];

  for (const item of loot) {
    if (!item) {
      console.error("Encountered undefined item in loot");
      continue;
    }
    await addItemToInventory(
      item,
      { ...characterProfile, inventory: currentInventory },
      {
        ...deps,
        setInventory: (newInventory) => {
          currentInventory = newInventory;
          deps.setInventory(newInventory);
        },
      }
    );
  }
  console.log("Finished processing all loot items");
};
