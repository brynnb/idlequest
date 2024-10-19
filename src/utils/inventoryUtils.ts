import { InventoryItem } from "@entities/InventoryItem";
import { InventorySlot } from "@entities/InventorySlot";
import CharacterProfile from "@entities/CharacterProfile";

export const getNextAvailableSlot = (
  inventory: InventoryItem[],
  generalSlots: number[]
): number | null => {
  const occupiedSlots = new Set(inventory.map((item) => item.slotid));

  for (const slot of generalSlots) {
    if (!occupiedSlots.has(slot)) {
      return slot;
    }
  }

  return null; // No available slots
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

  const total =  character.inventory.reduce((totalWeight, item) => {
    const itemWeight = Number(item.itemDetails?.weight) || 0;
    console.log("itemWeight", itemWeight);
    console.log("item name", item.itemDetails?.name);
    //show slot
    console.log("item slot", item.slotid);
    return totalWeight + itemWeight;
  }, 0);
  return Math.round(total / 10);
};
