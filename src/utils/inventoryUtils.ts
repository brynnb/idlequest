import { InventoryItem } from "../entities/InventoryItem";

export const getNextAvailableSlot = (inventory: InventoryItem[], generalSlots: number[]): number | null => {
  const occupiedSlots = new Set(inventory.map(item => item.slotid));
  
  for (const slot of generalSlots) {
    if (!occupiedSlots.has(slot)) {
      return slot;
    }
  }
  
  return null; // No available slots
};