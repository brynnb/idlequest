import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useChatStore from "@stores/ChatStore";
import {
  isItemAllowedInSlot,
  getEquippableSlots,
  isSlotAvailableForItem,
} from "@utils/itemUtils";
import { Item } from "@entities/Item";
import { InventoryItem } from "@entities/InventoryItem";
import { InventorySlot } from "@entities/InventorySlot";
import { processLootItems } from "@utils/lootUtils";
import { useInventorySelling } from "./useInventorySelling";
import { ItemClass } from "@entities/ItemClass";
import { InventoryKey } from "@entities/InventoryItem";
import CharacterClass from "@entities/CharacterClass";
import Race from "@entities/Race";

export const useInventoryActions = () => {
  const { sellGeneralInventory } = useInventorySelling();

  const handleLoot = (loot: Item[]) => {
    const { addInventoryItem, characterProfile, setInventory } =
      usePlayerCharacterStore.getState();
    const { autoSellEnabled } = useGameStatusStore.getState();
    const addChatMessage = useChatStore.getState().addMessage;

    const profileForLoot = characterProfile as unknown as {
      inventory?: InventoryItem[];
      class?: CharacterClass;
      race?: Race;
    };

    processLootItems(loot, profileForLoot, {
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
      (item) => item.bag === 0 && item.slot >= 22 && item.slot <= 29
    );

    console.log(
      "Items found in general inventory:",
      generalItems.map((item) => {
        return {
          name: item.itemDetails?.name,
          slot: item.slot,
          isBag: item.itemDetails?.itemclass === ItemClass.CONTAINER,
          bagSlots: item.itemDetails?.bagslots,
        };
      })
    );

    for (const inventoryItem of generalItems) {
      const itemDetails = inventoryItem.itemDetails;
      const originalSlot = inventoryItem.slot;

      if (itemDetails?.slots !== undefined && originalSlot !== undefined) {
        const possibleSlots = getEquippableSlots(itemDetails);

        for (const slotId of possibleSlots) {
          if (slotId >= 0 && slotId <= 22) {
            // Get fresh store and inventory state
            const currentStore = usePlayerCharacterStore.getState();
            inventory = currentStore.characterProfile?.inventory || [];
            const targetItem = inventory.find(
              (invItem) => invItem.bag === 0 && invItem.slot === slotId
            );

            const cc = currentStore.characterProfile?.class;
            const cr = currentStore.characterProfile?.race;
            const characterClass =
              cc && typeof cc === "object" ? (cc as CharacterClass) : undefined;
            const characterRace =
              cr && typeof cr === "object" ? (cr as Race) : undefined;

            if (
              characterClass &&
              characterRace &&
              isSlotAvailableForItem(
                inventoryItem,
                slotId as InventorySlot,
                characterClass,
                characterRace,
                inventory
              )
            ) {
              try {
                if (targetItem) {
                  await store.swapItems(
                    { bag: 0, slot: originalSlot },
                    { bag: 0, slot: slotId }
                  );
                } else {
                  await store.moveItemToSlot(
                    { bag: 0, slot: originalSlot },
                    { bag: 0, slot: slotId }
                  );
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
  // Auto-place cursor item using loot-like logic:
  // 1. Try to equip in empty equipment slot
  // 2. Check if item is an upgrade (swap with existing equipped item)
  // 3. Fall back to first available general inventory slot
  const handleAutoPlaceCursorItem = async () => {
    const store = usePlayerCharacterStore.getState();
    const inventory = store.characterProfile?.inventory || [];

    const cursorKey: InventoryKey = { bag: 0, slot: InventorySlot.Cursor };
    const cursorItem = inventory.find(
      (item) => item.bag === 0 && item.slot === InventorySlot.Cursor
    );

    if (!cursorItem?.itemDetails) {
      return false; // No item on cursor
    }

    const cc = store.characterProfile?.class;
    const cr = store.characterProfile?.race;
    const characterClass = cc && typeof cc === "object" ? (cc as CharacterClass) : undefined;
    const characterRace = cr && typeof cr === "object" ? (cr as Race) : undefined;

    if (!characterClass || !characterRace) {
      return false;
    }

    const itemDetails = cursorItem.itemDetails;

    // Step 1: Check if item can be equipped in an empty slot
    if (itemDetails.slots !== undefined && itemDetails.itemclass !== ItemClass.CONTAINER) {
      const equippableSlots = getEquippableSlots(itemDetails);

      for (const slot of equippableSlots) {
        if (slot >= 0 && slot <= 21) { // Equipment slots only
          const existingItem = inventory.find(
            (item) => item.bag === 0 && item.slot === slot
          );

          if (!existingItem) {
            if (isSlotAvailableForItem(
              cursorItem,
              slot as InventorySlot,
              characterClass,
              characterRace,
              inventory
            )) {
              await store.moveItemToSlot(cursorKey, { bag: 0, slot });
              return true;
            }
          }
        }
      }

      // Step 2: Check if item is an upgrade for any equipped slot
      // (For simplicity, we'll just try to swap with occupied slots the user can equip to)
      for (const slot of equippableSlots) {
        if (slot >= 0 && slot <= 21) {
          const existingItem = inventory.find(
            (item) => item.bag === 0 && item.slot === slot
          );

          if (existingItem) {
            if (isSlotAvailableForItem(
              cursorItem,
              slot as InventorySlot,
              characterClass,
              characterRace,
              inventory
            )) {
              // Swap with the existing item (existing goes to cursor)
              await store.swapItems(cursorKey, { bag: 0, slot });
              return true;
            }
          }
        }
      }
    }

    // Step 3: Find first available general inventory slot
    for (let slot = InventorySlot.General1; slot <= InventorySlot.General8; slot++) {
      const existingItem = inventory.find(
        (item) => item.bag === 0 && item.slot === slot
      );

      if (!existingItem) {
        await store.moveItemToSlot(cursorKey, { bag: 0, slot });
        return true;
      }
    }

    // Step 4: Find first available bag slot
    for (let generalSlot = InventorySlot.General1; generalSlot <= InventorySlot.General8; generalSlot++) {
      const bagContainer = inventory.find(
        (item) => item.bag === 0 && item.slot === generalSlot
      );

      // Check if this general slot has a bag/container
      if (bagContainer?.itemDetails?.itemclass === ItemClass.CONTAINER && bagContainer.itemDetails.bagslots) {
        const bagId = generalSlot + 1; // Bag IDs are slot+1
        const bagSlots = bagContainer.itemDetails.bagslots;

        for (let bagSlot = 0; bagSlot < bagSlots; bagSlot++) {
          const itemInBagSlot = inventory.find(
            (item) => item.bag === bagId && item.slot === bagSlot
          );

          if (!itemInBagSlot) {
            await store.moveItemToSlot(cursorKey, { bag: bagId, slot: bagSlot });
            return true;
          }
        }
      }
    }

    // No available slot found
    return false;
  };

  return {
    handleItemClick,
    handleLoot,
    handleEquipAllItems,
    handleAutoPlaceCursorItem,
  };
};

export const handleItemClick = (key: InventoryKey) => {
  const { characterProfile, swapItems, moveItemToSlot } =
    usePlayerCharacterStore.getState();

  const cursorKey: InventoryKey = { bag: 0, slot: InventorySlot.Cursor };

  const getItem = (k: InventoryKey) =>
    characterProfile?.inventory?.find(
      (it) => it.bag === k.bag && it.slot === k.slot
    );

  const cursorItem = getItem(cursorKey);
  const destItem = getItem(key);

  // If we have something on cursor, try to place it into clicked slot
  const cc = characterProfile.class;
  const cr = characterProfile.race;
  const characterClass =
    cc && typeof cc === "object" ? (cc as CharacterClass) : undefined;
  const characterRace = cr && typeof cr === "object" ? (cr as Race) : undefined;

  if (cursorItem && characterClass && characterRace) {
    // Only enforce equip-slot rules client-side; server is authoritative for everything.
    if (
      key.bag !== 0 ||
      isItemAllowedInSlot(
        cursorItem,
        key.slot as InventorySlot,
        characterClass,
        characterRace,
        characterProfile.inventory
      )
    ) {
      if (destItem) {
        swapItems(cursorKey, key);
      } else {
        moveItemToSlot(cursorKey, key);
      }
    }
    return;
  }

  // Otherwise, pick up the clicked item onto the cursor
  if (destItem) {
    moveItemToSlot(key, cursorKey);
  }
};
