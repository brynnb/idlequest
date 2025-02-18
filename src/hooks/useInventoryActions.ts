import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useChatStore from "@stores/ChatStore";
import {
  isItemAllowedInSlot,
  getEquippableSlots,
  isSlotAvailableForItem,
} from "@utils/itemUtils";
import { Item } from "@entities/Item";
import { InventorySlot } from "@entities/InventorySlot";
import { processLootItems } from "@utils/lootUtils";
import { useInventorySelling } from "./useInventorySelling";

export const useInventoryActions = () => {
  const { sellGeneralInventory } = useInventorySelling();

  const handleLoot = (loot: Item[]) => {
    const { addInventoryItem, characterProfile, setInventory } =
      usePlayerCharacterStore.getState();
    const { autoSellEnabled } = useGameStatusStore.getState();
    const addChatMessage = useChatStore.getState().addMessage;

    processLootItems(loot, characterProfile, {
      addInventoryItem,
      setInventory,
      addChatMessage,
      sellItem: () => sellGeneralInventory(false),
      autoSellEnabled,
    });
  };

  const addItemToInventoryByItemId = async (itemId: number) => {
    const { addInventoryItem, characterProfile, setInventory } =
      usePlayerCharacterStore.getState();
    const { autoSellEnabled } = useGameStatusStore.getState();
    const addChatMessage = useChatStore.getState().addMessage;

    const item = { id: itemId };
    await processLootItems([item], characterProfile, {
      addInventoryItem,
      setInventory,
      addChatMessage,
      sellItem: () => sellGeneralInventory(false),
      autoSellEnabled,
    });
  };

  const handleEquipAllItems = async () => {
    const store = usePlayerCharacterStore.getState();
    let inventory = store.characterProfile?.inventory || [];

    const generalItems = inventory.filter(
      (item) => item.slotid && item.slotid > 22
    );

    const getBagContents = (bagSlot: number, bagSize: number) => {
      const startSlot = 262 + (bagSlot - 23) * 10;
      return inventory
        .filter(
          (item) =>
            item.slotid !== undefined &&
            item.slotid >= startSlot &&
            item.slotid < startSlot + bagSize
        )
        .map((item) => ({
          name: item.itemDetails?.name,
          slot: item.slotid,
        }));
    };

    console.log(
      "Items found in general inventory:",
      generalItems.map((item) => {
        const bagContents =
          item.itemDetails?.itemclass === 1 && item.slotid !== undefined
            ? getBagContents(item.slotid, item.itemDetails.bagslots || 0)
            : [];

        return {
          name: item.itemDetails?.name,
          slot: item.slotid,
          isBag: item.itemDetails?.itemclass === 1,
          bagSlots: item.itemDetails?.bagslots,
          contents: bagContents,
        };
      })
    );

    for (const inventoryItem of generalItems) {
      const itemDetails = inventoryItem.itemDetails;
      const originalSlot = inventoryItem.slotid;

      if (itemDetails?.slots !== undefined && originalSlot !== undefined) {
        const possibleSlots = getEquippableSlots(itemDetails);

        for (const slotId of possibleSlots) {
          if (slotId >= 0 && slotId <= 22) {
            // Get fresh store and inventory state
            const currentStore = usePlayerCharacterStore.getState();
            inventory = currentStore.characterProfile?.inventory || [];
            const targetItem = inventory.find(
              (invItem) => invItem.slotid === slotId
            );

            if (itemDetails.itemclass === 1) {
              console.log("Processing bag move:", {
                bagName: itemDetails.name,
                fromSlot: originalSlot,
                toSlot: slotId,
                bagSize: itemDetails.bagslots || 0,
                currentContents: getBagContents(
                  originalSlot,
                  itemDetails.bagslots || 0
                ),
              });
            }

            if (
              currentStore.characterProfile?.class &&
              currentStore.characterProfile?.race &&
              isSlotAvailableForItem(
                inventoryItem,
                slotId as InventorySlot,
                currentStore.characterProfile.class,
                currentStore.characterProfile.race,
                inventory
              )
            ) {
              try {
                if (targetItem) {
                  await store.swapItems(originalSlot, slotId);
                } else {
                  await store.moveItemToSlot(originalSlot, slotId);
                }

                // Log the state after the move if it's a bag
                if (itemDetails.itemclass === 1) {
                  console.log("Bag move complete:", {
                    bagName: itemDetails.name,
                    newSlot: slotId,
                    newContents: getBagContents(
                      slotId,
                      itemDetails.bagslots || 0
                    ),
                  });
                }

                // Wait a tick for the store to update
                await new Promise((resolve) => setTimeout(resolve, 0));
              } catch (error) {
                console.error("Error during move/swap:", error);
              }
              break;
            }
          }
        }
      }
    }
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
        characterProfile.class,
        characterProfile.race,
        characterProfile.inventory
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
