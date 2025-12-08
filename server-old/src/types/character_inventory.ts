/**
 * Types related to character inventory
 * Based on the character_inventory table in the database
 */

/**
 * Represents a character inventory item from the database
 */
export interface CharacterInventory {
  id: number;
  slotid: number;
  itemid: number;
  charges: number;
  custom_data: string | null;
  serialnumber: number;
  initialserial: number;
}

/**
 * Represents a simplified view of a character inventory item
 */
export interface SimpleInventoryItem {
  slotId: number;
  itemId: number;
  charges: number;
  customData: string | null;
  serialNumber: number;
}

/**
 * Converts a CharacterInventory object to a SimpleInventoryItem object
 */
export function toSimpleInventoryItem(
  inventory: CharacterInventory
): SimpleInventoryItem {
  return {
    slotId: inventory.slotid,
    itemId: inventory.itemid,
    charges: inventory.charges,
    customData: inventory.custom_data,
    serialNumber: inventory.serialnumber,
  };
}
