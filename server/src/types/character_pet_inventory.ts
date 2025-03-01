/**
 * Types related to character pet inventory
 * Based on the character_pet_inventory table in the database
 */

/**
 * Represents a character pet inventory item from the database
 */
export interface CharacterPetInventory {
  char_id: number;
  pet: number;
  slot: number;
  item_id: number;
}

/**
 * Represents a simplified view of a character pet inventory item
 */
export interface SimplePetInventoryItem {
  characterId: number;
  petId: number;
  slotId: number;
  itemId: number;
}

/**
 * Converts a CharacterPetInventory object to a SimplePetInventoryItem object
 */
export function toSimplePetInventoryItem(
  petItem: CharacterPetInventory
): SimplePetInventoryItem {
  return {
    characterId: petItem.char_id,
    petId: petItem.pet,
    slotId: petItem.slot,
    itemId: petItem.item_id,
  };
}
