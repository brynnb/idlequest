import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useChatStore, { MessageType } from "@stores/ChatStore";
import { getItemById } from "@utils/databaseOperations";
import {
  isItemAllowedInSlot,
  findFirstAvailableGeneralSlot,
  isEquippableItem,
  isEquippableWithClass,
  isEquippableWithRace,
  getEquippableSlots,
} from "@utils/itemUtils";
import { Item } from "@entities/Item";
import { InventoryItem } from "@entities/InventoryItem";
import { InventorySlot } from "@entities/InventorySlot";
import getItemScore from "@utils/getItemScore";
import { useInventorySelling } from "./useInventorySelling";

export const useInventoryActions = () => {
  const { sellItem } = useInventorySelling();

  const processLootItems = (loot: Item[]) => {
    loot.forEach((item) => {
      if (!item) {
        console.error("Encountered undefined item in loot");
        return;
      }

      addItemToInventory(item);
    });
  };

  const handleItemClick = (slotId: InventorySlot) => {
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
          swapItems(InventorySlot.Cursor, slotId);
        } else {
          moveItemToSlot(cursorItem.slotid, slotId);
        }
      }
    } else if (currentSlotItem) {
      moveItemToSlot(slotId, InventorySlot.Cursor);
    }
  };

  const handleLoot = (loot: Item[]) => {
    processLootItems(loot);
  };

  const addItemToInventory = async (item: Item) => {
    const { addInventoryItem, characterProfile, setInventory } =
      usePlayerCharacterStore.getState();
    const addChatMessage = useChatStore.getState().addMessage;
    const { autoSellEnabled } = useGameStatusStore.getState();

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
          } else if (autoSellEnabled) {
            sellItem(existingItem.itemDetails);
            updatedInventory = updatedInventory.filter(
              (invItem) => invItem.slotid !== bestSlotToReplace
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
    } else if (autoSellEnabled) {
      sellItem(itemDetails);
    } else {
      addChatMessage(
        `Inventory full, item dropped: ${itemDetails.Name}`,
        MessageType.LOOT
      );
    }

    setInventory(updatedInventory);
  };

  const addItemToInventoryByItemId = async (itemId: number) => {
    const { characterProfile, addInventoryItem } =
      usePlayerCharacterStore.getState();
    const itemDetails = await getItemById(itemId);

    if (!itemDetails) {
      console.error(`Failed to fetch item details for item ID: ${itemId}`);
      return;
    }

    const generalSlot = findFirstAvailableGeneralSlot(
      characterProfile.inventory
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

  const handleEquipAllItems = () => {
    const { characterProfile, setInventory } =
      usePlayerCharacterStore.getState();
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

  return {
    handleItemClick,
    addItemToInventory,
    handleLoot,
    addItemToInventoryByItemId,
    handleEquipAllItems,
  };
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
        swapItems(InventorySlot.Cursor, slotId);
      } else {
        moveItemToSlot(cursorItem.slotid, slotId);
      }
    }
  } else if (currentSlotItem) {
    moveItemToSlot(slotId, InventorySlot.Cursor);
  }
};
