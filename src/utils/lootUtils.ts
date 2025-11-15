import { Item } from "@entities/Item";
import { InventoryItem } from "@entities/InventoryItem";
import { getItemById } from "@utils/databaseOperations";
import {
  findFirstAvailableSlotForItem,
  isEquippableItem,
  isEquippableWithClass,
  isEquippableWithRace,
  getEquippableSlots,
  isSlotAvailableForItem,
} from "@utils/itemUtils";
import getItemScore from "@utils/getItemScore";
import { MessageType } from "@stores/ChatStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useChatStore from "@stores/ChatStore";
import { InventorySlot } from "@entities/InventorySlot";
import CharacterClass from "@entities/CharacterClass";
import Race from "@entities/Race";
import { ItemClass } from "@entities/ItemClass";

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

const addItemToInventory = async (
  item: Item,
  characterProfile: {
    inventory?: InventoryItem[];
    class?: CharacterClass;
    race?: Race;
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
    characterProfile.race
  ) {
    const characterClass = characterProfile.class;
    const characterRace = characterProfile.race;

    if (
      isEquippableWithClass(itemDetails, characterClass) &&
      isEquippableWithRace(itemDetails, characterRace)
    ) {
      const equippableSlots = getEquippableSlots(itemDetails);

      // First check for empty equipment slots
      for (const slot of equippableSlots) {
        const existingItem = updatedInventory.find(
          (invItem) => invItem.slotid === slot
        );

        if (!existingItem) {
          if (
            isSlotAvailableForItem(
              {
                itemid: item.id,
                slotid: slot,
                charges: 1,
                itemDetails,
              } as InventoryItem,
              slot as InventorySlot,
              characterClass,
              characterRace,
              updatedInventory
            )
          ) {
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
          const characterClassObj = characterProfile.class;

          const newItemScore = getItemScore(itemDetails, characterClassObj);
          const existingItemScore = getItemScore(
            existingItem.itemDetails,
            characterClassObj
          );
          const scoreDifference = newItemScore - existingItemScore;

          if (scoreDifference > maxScoreDifference) {
            maxScoreDifference = scoreDifference;
            bestSlotToReplace = slot;
            itemToReplace = existingItem;
          }
        }
      }

      if (
        bestSlotToReplace !== null &&
        maxScoreDifference > 0 &&
        itemToReplace?.itemDetails
      ) {
        // Move existing item to general inventory first
        const generalSlot = findFirstAvailableSlotForItem(
          updatedInventory,
          itemToReplace
        );
        if (generalSlot !== undefined) {
          // Add the old item to general inventory
          const movedItem = {
            ...itemToReplace,
            slotid: generalSlot,
          };
          updatedInventory = updatedInventory.filter(
            (item) => item.slotid !== itemToReplace?.slotid
          );
          updatedInventory.push(movedItem);

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
          if (itemToReplace.slotid !== undefined) {
            usePlayerCharacterStore
              .getState()
              .removeInventoryItem(itemToReplace.slotid);
          }
          updatedInventory = updatedInventory.filter(
            (invItem) => invItem.slotid !== bestSlotToReplace
          );
        } else {
          addChatMessage(
            `Inventory full, item dropped: ${itemToReplace.itemDetails.name}`,
            MessageType.LOOT
          );
          updatedInventory = updatedInventory.filter(
            (invItem) => invItem.slotid !== bestSlotToReplace
          );
        }
      }
    }
  }

  // Step 4: If not equipped or an upgrade, try to find general inventory slot
  const newItem: InventoryItem = {
    itemid: item.id,
    charges: 1,
    itemDetails,
    slotid: undefined,
  };
  const generalSlot = findFirstAvailableSlotForItem(updatedInventory, newItem);
  if (generalSlot !== undefined) {
    newItem.slotid = generalSlot;
    updatedInventory.push(newItem);
    setInventory(updatedInventory);
  } else if (autoSellEnabled) {
    // Sell all eligible items in inventory and delete NO DROP items if enabled
    updatedInventory = updatedInventory.filter((invItem) => {
      if (
        invItem.slotid !== undefined &&
        invItem.slotid >= 23 && // Only sell items in general inventory and bags
        invItem.itemDetails
      ) {
        if (
          !invItem.locked && // Don't sell locked items
          invItem.itemDetails.itemclass !== ItemClass.CONTAINER && // Don't sell bags
          invItem.itemDetails.nodrop != 0 && // Don't sell NO DROP
          invItem.itemDetails.norent != 0 // Don't sell NO RENT
        ) {
          if (sellSingleItem(invItem.itemDetails)) {
            usePlayerCharacterStore
              .getState()
              .removeInventoryItem(invItem.slotid);
            return false; // Remove this item from updatedInventory
          }
        } else if (deleteNoDrop && !invItem.locked && invItem.itemDetails.nodrop === 0) {
          // Delete NO DROP items if deleteNoDrop is enabled (but not if locked)
          usePlayerCharacterStore
            .getState()
            .removeInventoryItem(invItem.slotid);
          return false; // Remove this item from updatedInventory
        }
      }
      return true; // Keep this item in updatedInventory
    });

    // After selling everything, try to add the new item again
    const generalSlot = findFirstAvailableSlotForItem(
      updatedInventory,
      newItem
    );
    if (generalSlot !== undefined) {
      newItem.slotid = generalSlot;
      updatedInventory.push(newItem);
      setInventory(updatedInventory);
    } else {
      // If still no space after selling everything, handle this item
      if (deleteNoDrop && itemDetails.nodrop === 0) {
        // Delete NO DROP item
      } else {
        sellSingleItem(itemDetails);
      }
    }
  } else {
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
    class?: CharacterClass;
    race?: Race;
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
