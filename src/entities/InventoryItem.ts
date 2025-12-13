import { Item } from "@entities/Item";

export interface InventoryKey {
  bag: number;
  slot: number;
}

export interface InventoryItem {
  charid?: number; // Character Identifier
  bag: number; // Bag index: 0 = equipment/general/cursor, 1-8 = bag contents (general slots), 9 = cursor contents
  slot: number; // Slot within bag contents (0-9) OR equipment/general/cursor slot id (0-30) when bag=0
  itemid?: number; // Item Identifier
  charges?: number; // Charges
  color?: number; // Color
  augslot1?: number; // Augment Slot 1
  augslot2?: number; // Augment Slot 2
  augslot3?: number; // Augment Slot 3
  augslot4?: number; // Augment Slot 4
  augslot5?: number; // Augment Slot 5
  augslot6?: number; // Augment Slot 6
  instnodrop?: number; // No Drop: 0 = True, 1 = False
  custom_data?: string; // Custom Data
  ornamenticon?: number; // Ornamentation Icon
  ornamentidfile?: number; // Ornamentation Texture
  ornament_hero_model?: number; // Ornamentation Hero's Forge Model
  itemDetails?: Item;
}
