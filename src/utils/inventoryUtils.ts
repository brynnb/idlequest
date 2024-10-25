import { InventoryItem } from "@entities/InventoryItem";
import { InventorySlot } from "@entities/InventorySlot";
import CharacterProfile from "@entities/CharacterProfile";
import { getItemById } from "@utils/databaseOperations";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

const GENERAL_SLOTS = [23, 24, 25, 26, 27, 28, 29, 30];

export const getBagStartingSlot = (baseSlot: number): number => {
  const slotMap = {
    [InventorySlot.Cursor]: 342,
    23: 262,
    24: 272,
    25: 282,
    26: 292,
    27: 302,
    28: 312,
    29: 322,
    30: 332
  };
  return slotMap[baseSlot as keyof typeof slotMap] ?? -1;
};

export const getNextAvailableSlot = (
  inventory: InventoryItem[]
): number | null => {
  // Remove any duplicate slots first
  const deduplicatedInventory = inventory.reduce((acc, item) => {
    const existingItem = acc.find(i => i.slotid === item.slotid);
    if (!existingItem) {
      acc.push(item);
    }
    return acc;
  }, [] as InventoryItem[]);

  const occupiedSlots = new Set(deduplicatedInventory.map((item) => item.slotid));

  // First check general slots
  for (const slot of GENERAL_SLOTS) {
    if (!occupiedSlots.has(slot)) {
      return slot;
    }
  }

  // Then check bag slots, but only for bags that exist
  for (const baseSlot of GENERAL_SLOTS) {
    const bagItem = deduplicatedInventory.find(
      item => item.slotid === baseSlot && item.itemDetails?.itemclass === 1
    );
    
    if (bagItem) {
      const bagSize = bagItem.itemDetails.bagslots || 0;
      const startingSlot = getBagStartingSlot(baseSlot);
      
      if (startingSlot > 0) {
        for (let i = 0; i < bagSize; i++) {
          const bagSlot = startingSlot + i;
          if (!occupiedSlots.has(bagSlot)) {
            return bagSlot;
          }
        }
      }
    }
  }

  return null;
};

export const calculateTotalEquippedAC = (
  character: CharacterProfile
): number => {
  if (!character.inventory) return 0;

  return character.inventory.reduce((totalAC, item) => {
    if (
      item.slotid !== undefined &&
      item.slotid >= InventorySlot.Charm &&
      item.slotid <= InventorySlot.Ammo
    ) {
      const itemAC = Number(item.itemDetails?.ac) || 0;
      return totalAC + itemAC;
    }
    return totalAC;
  }, 0);
};

export const calculateTotalWeight = (character: CharacterProfile): number => {
  if (!character.inventory) return 0;

  const total = character.inventory.reduce((totalWeight, item) => {
    const itemWeight = Number(item.itemDetails?.weight) || 0;

    return totalWeight + itemWeight;
  }, 0);
  return Math.round(total / 10);
};
