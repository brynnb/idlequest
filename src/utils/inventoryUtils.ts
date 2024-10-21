import { InventoryItem } from "@entities/InventoryItem";
import { InventorySlot } from "@entities/InventorySlot";
import CharacterProfile from "@entities/CharacterProfile";
import { getItemById } from "@utils/databaseOperations";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

export const getNextAvailableSlot = (
  inventory: InventoryItem[],
  generalSlots: number[],
  bagSlots: number[]
): number | null => {
  const occupiedSlots = new Set(inventory.map((item) => item.slotid));

  for (const slot of generalSlots) {
    if (!occupiedSlots.has(slot)) {
      return slot;
    }
  }

  for (const slot of bagSlots) {
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

  const total = character.inventory.reduce((totalWeight, item) => {
    const itemWeight = Number(item.itemDetails?.weight) || 0;

    return totalWeight + itemWeight;
  }, 0);
  return Math.round(total / 10);
};

export const addItemToInventory = async (itemId: number): Promise<boolean> => {
  const { addInventoryItem, characterProfile } =
    usePlayerCharacterStore.getState();
  const item = await getItemById(itemId);

  if (item) {
    const generalSlots = Object.values(InventorySlot).filter(slot => slot >= InventorySlot.General1Bag && slot <= InventorySlot.General8Bag);
    const bagSlots = Object.values(InventorySlot).filter(slot => slot >= InventorySlot.General1Bag && slot <= InventorySlot.General8Bag);
    const nextAvailableSlot = getNextAvailableSlot(
      characterProfile.inventory,
      generalSlots,
      bagSlots
    );

    if (nextAvailableSlot !== null) {
      await addInventoryItem({
        itemid: item.id,
        slotid: nextAvailableSlot,
        charges: 1,
        itemDetails: item,
      });
      console.log(`Added item ${item.name} to slot ${nextAvailableSlot}`);
      return true;
    } else {
      console.log("No available slots in general inventory");
      return false;
    }
  } else {
    console.log(`Failed to fetch item with ID ${itemId}`);
    return false;
  }
};
