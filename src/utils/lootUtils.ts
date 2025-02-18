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
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useChatStore from "@stores/ChatStore";
import classes from "../../data/json/classes.json";

const sellSingleItem = (itemDetails: Item) => {
  if (
    itemDetails.itemclass != 1 &&
    itemDetails.nodrop != 0 &&
    itemDetails.norent != 0
  ) {
    const price = Math.floor(itemDetails.price || 0);
    const platinum = Math.floor(price / 1000);
    const gold = Math.floor((price % 1000) / 100);
    const silver = Math.floor((price % 100) / 10);
    const copper = price % 10;

    usePlayerCharacterStore.setState((state) => ({
      characterProfile: {
        ...state.characterProfile,
        platinum: (state.characterProfile.platinum || 0) + platinum,
        gold: (state.characterProfile.gold || 0) + gold,
        silver: (state.characterProfile.silver || 0) + silver,
        copper: (state.characterProfile.copper || 0) + copper,
      },
    }));
    console.log(`Selling ${itemDetails.name} for ${price} copper`);
    return true;
  }
  return false;
};

export const addItemToInventory = async (
  item: Item,
  characterProfile: {
    inventory?: InventoryItem[];
    class?: number;
    race?: number;
  },
  options?: {
    addInventoryItem?: (item: InventoryItem) => void;
    setInventory?: (inventory: InventoryItem[]) => void;
    addChatMessage?: (message: string, type: MessageType) => void;
    autoSellEnabled?: boolean;
    sellItem?: () => void;
  }
) => {
  const setInventory =
    options?.setInventory || usePlayerCharacterStore.getState().setInventory;
  const addChatMessage =
    options?.addChatMessage || useChatStore.getState().addMessage;
  const { autoSellEnabled, deleteNoDrop } = useGameStatusStore.getState();
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
        const characterClassId =
          typeof characterProfile.class === "object" &&
          characterProfile.class !== null
            ? (characterProfile.class as CharacterClass).id
            : characterProfile.class;
        const characterClass =
          classes.find((c) => c.id === characterClassId) ||
          ({
            id: characterClassId,
            bitmask: 1,
          } as CharacterClass);

        const newItemScore = getItemScore(itemDetails, characterClass);
        const existingItemScore = getItemScore(
          existingItem.itemDetails,
          characterClass
        );
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
      } else if (autoSellEnabled) {
        console.log(
          `Inventory full and auto-sell enabled, selling ${itemToReplace.itemDetails.name}`
        );
        if (itemToReplace.slotid !== undefined) {
          usePlayerCharacterStore
            .getState()
            .removeInventoryItem(itemToReplace.slotid);
        }
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
  } else if (autoSellEnabled) {
    console.log(
      `Inventory full and auto-sell enabled, selling all eligible items`
    );
    // Sell all eligible items in inventory and delete NO DROP items if enabled
    updatedInventory = updatedInventory.filter((invItem) => {
      if (
        invItem.slotid !== undefined &&
        invItem.slotid >= 23 && // Only sell items in general inventory and bags
        invItem.itemDetails
      ) {
        if (
          invItem.itemDetails.itemclass != 1 && // Don't sell bags
          invItem.itemDetails.nodrop != 0 && // Don't sell NO DROP
          invItem.itemDetails.norent != 0 // Don't sell NO RENT
        ) {
          if (sellSingleItem(invItem.itemDetails)) {
            usePlayerCharacterStore
              .getState()
              .removeInventoryItem(invItem.slotid);
            return false; // Remove this item from updatedInventory
          }
        } else if (deleteNoDrop && invItem.itemDetails.nodrop === 0) {
          // Delete NO DROP items if deleteNoDrop is enabled
          console.log(`Deleting NO DROP item: ${invItem.itemDetails.name}`);
          usePlayerCharacterStore
            .getState()
            .removeInventoryItem(invItem.slotid);
          return false; // Remove this item from updatedInventory
        }
      }
      return true; // Keep this item in updatedInventory
    });

    // After selling everything, try to add the new item again
    const generalSlot = findFirstAvailableGeneralSlot(updatedInventory);
    if (generalSlot !== undefined) {
      const newItem = {
        itemid: item.id,
        slotid: generalSlot,
        charges: 1,
        itemDetails,
      };
      updatedInventory.push(newItem);
      setInventory(updatedInventory);
    } else {
      // If still no space after selling everything, handle this item
      if (deleteNoDrop && itemDetails.nodrop === 0) {
        console.log(`Deleting NO DROP item: ${itemDetails.name}`);
      } else {
        sellSingleItem(itemDetails);
      }
    }
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
  options?: {
    addInventoryItem?: (item: InventoryItem) => void;
    setInventory?: (inventory: InventoryItem[]) => void;
    addChatMessage?: (message: string, type: MessageType) => void;
    autoSellEnabled?: boolean;
    sellItem?: () => void;
  }
) => {
  if (!loot || loot.length === 0) {
    return;
  }

  console.log(`Processing ${loot.length} loot items`);
  let currentInventory = [...(characterProfile.inventory || [])];

  for (const item of loot) {
    if (!item) {
      console.error("Encountered undefined item in loot");
      continue;
    }
    if (item.id) {
      const itemDetails = await getItemById(item.id);
      if (itemDetails?.name) {
        const startsWithArticle = /^(a|an)\s+/i.test(itemDetails.name);
        (options?.addChatMessage || useChatStore.getState().addMessage)(
          `You have looted ${
            startsWithArticle
              ? ""
              : (/^[aeiou]/i.test(itemDetails.name) ? "an" : "a") + " "
          }${itemDetails.name}`,
          MessageType.LOOT
        );
      }
    }
    await addItemToInventory(
      item,
      {
        ...characterProfile,
        inventory: currentInventory,
      },
      options
    );

    // Update currentInventory after each item is processed
    currentInventory =
      usePlayerCharacterStore.getState().characterProfile.inventory || [];
  }
  console.log("Finished processing all loot items");
};
