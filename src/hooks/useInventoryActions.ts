import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useChatStore, { MessageType } from "@stores/ChatStore";
import { getItemById } from "@utils/databaseOperations";
import {
  isItemAllowedInSlot,
  findFirstAvailableGeneralSlot,
} from "@utils/itemUtils";
import { Item } from "@entities/Item";
import { InventoryItem } from "@entities/InventoryItem";
import { InventorySlot } from "@entities/InventorySlot";
import { useInventorySelling } from "./useInventorySelling";
import Race from "@entities/Race";
import CharacterClass from "@entities/CharacterClass";

// Import JSON data
import classesData from "/data/classes.json";
import racesData from "/data/races.json";

export const processLootItems = (loot: Item[]) => {
  const { characterProfile, setInventory } = usePlayerCharacterStore.getState();
  if (!characterProfile) return;

  const updatedInventory = [...(characterProfile.inventory || [])];

  for (const item of loot) {
    if (!item) {
      console.error("Encountered undefined item in loot");
      continue;
    }

    const slot = findFirstAvailableGeneralSlot(updatedInventory);
    if (slot !== undefined) {
      const newItem: InventoryItem = {
        itemid: item.id,
        slotid: slot,
        charges: 1,
        itemDetails: item,
      };
      updatedInventory.push(newItem);
    } else {
      console.warn("No available slots for item:", item.Name);
      useChatStore
        .getState()
        .addMessage(
          `Inventory full, item dropped: ${item.Name}`,
          MessageType.LOOT
        );
    }
  }

  setInventory(updatedInventory);
};

export const handleItemClick = (slotId: InventorySlot) => {
  const { characterProfile, swapItems, moveItemToSlot } =
    usePlayerCharacterStore.getState();
  if (!characterProfile?.class || !characterProfile?.race) return;

  const getInventoryItemForSlot = (slot: InventorySlot) => {
    return characterProfile?.inventory?.find((item) => item.slotid === slot);
  };

  const cursorItem = getInventoryItemForSlot(InventorySlot.Cursor);
  const currentSlotItem = getInventoryItemForSlot(slotId);

  if (!cursorItem?.slotid) return;

  const characterClass = classesData.find(
    (c: CharacterClass) => c.id === characterProfile.class
  );
  const characterRace = racesData.find(
    (r: Race) => r.id === characterProfile.race
  );

  if (!characterClass || !characterRace) {
    console.error("Could not find class or race data");
    return;
  }

  if (cursorItem) {
    if (
      isItemAllowedInSlot(cursorItem, slotId, characterClass, characterRace)
    ) {
      if (currentSlotItem) {
        swapItems(InventorySlot.Cursor, slotId);
      } else {
        moveItemToSlot(cursorItem.slotid, slotId);
      }
    }
  } else if (currentSlotItem?.slotid) {
    moveItemToSlot(currentSlotItem.slotid, InventorySlot.Cursor);
  }
};

export const useInventoryActions = () => {
  const { sellGeneralInventory } = useInventorySelling();
  const { autoSellEnabled } = useGameStatusStore.getState();
  const addChatMessage = useChatStore.getState().addMessage;

  const handleLoot = (loot: Item[]) => {
    processLootItems(loot);
  };

  const addItemToInventory = async (item: Item) => {
    const { characterProfile, setInventory } =
      usePlayerCharacterStore.getState();
    if (!characterProfile?.inventory) return;

    const updatedInventory = [...characterProfile.inventory];
    const slot = findFirstAvailableGeneralSlot(updatedInventory);

    if (slot !== undefined) {
      const newItem: InventoryItem = {
        itemid: item.id,
        slotid: slot,
        charges: 1,
        itemDetails: item,
      };
      updatedInventory.push(newItem);
      setInventory(updatedInventory);
    } else if (autoSellEnabled) {
      sellGeneralInventory(false);
    } else {
      addChatMessage(
        `Inventory full, item dropped: ${item.Name}`,
        MessageType.LOOT
      );
    }
  };

  const addItemToInventoryByItemId = async (itemId: number) => {
    const { characterProfile, addInventoryItem } =
      usePlayerCharacterStore.getState();
    if (!characterProfile?.inventory) return;

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

  return {
    handleItemClick,
    addItemToInventory,
    handleLoot,
    addItemToInventoryByItemId,
  };
};
