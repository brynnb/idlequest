import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useChatStore from "@stores/ChatStore";
import { isItemAllowedInSlot, getEquippableSlots } from "@utils/itemUtils";
import { Item } from "@entities/Item";
import { InventorySlot } from "@entities/InventorySlot";
import CharacterClass from "@entities/CharacterClass";
import Race from "@entities/Race";
import { addItemToInventory, processLootItems } from "@utils/lootUtils";
import { useInventorySelling } from "./useInventorySelling";

export const useInventoryActions = () => {
  const { sellItem } = useInventorySelling();

  const handleLoot = (loot: Item[]) => {
    const { addInventoryItem, characterProfile, setInventory } =
      usePlayerCharacterStore.getState();
    const { autoSellEnabled } = useGameStatusStore.getState();
    const addChatMessage = useChatStore.getState().addMessage;

    processLootItems(loot, characterProfile, {
      addInventoryItem,
      setInventory,
      addChatMessage,
      sellItem,
      autoSellEnabled,
    });
  };

  const addItemToInventoryByItemId = async (itemId: number) => {
    const { addInventoryItem, characterProfile, setInventory } =
      usePlayerCharacterStore.getState();
    const { autoSellEnabled } = useGameStatusStore.getState();
    const addChatMessage = useChatStore.getState().addMessage;

    const item = { id: itemId };
    await addItemToInventory(item, characterProfile, {
      addInventoryItem,
      setInventory,
      addChatMessage,
      sellItem,
      autoSellEnabled,
    });
  };

  const handleEquipAllItems = () => {
    const { characterProfile, setInventory } =
      usePlayerCharacterStore.getState();
    const newInventory = [...(characterProfile.inventory || [])];

    const generalItems = newInventory.filter(
      (item) => item.slotid && item.slotid > 22
    );

    for (const inventoryItem of generalItems) {
      const itemDetails = inventoryItem.itemDetails;

      if (itemDetails && itemDetails.slots !== undefined) {
        const possibleSlots = getEquippableSlots(itemDetails);

        for (const slotId of possibleSlots) {
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

  if (cursorItem && characterProfile.class && characterProfile.race) {
    if (
      isItemAllowedInSlot(
        cursorItem,
        slotId,
        { id: characterProfile.class, bitmask: 1 } as CharacterClass,
        { id: characterProfile.race, bitmask: 1 } as Race
      )
    ) {
      if (currentSlotItem && cursorItem.slotid !== undefined) {
        swapItems(InventorySlot.Cursor, slotId);
      } else if (cursorItem.slotid !== undefined) {
        moveItemToSlot(cursorItem.slotid, slotId);
      }
    }
  } else if (currentSlotItem && currentSlotItem.slotid !== undefined) {
    moveItemToSlot(currentSlotItem.slotid, InventorySlot.Cursor);
  }
};
