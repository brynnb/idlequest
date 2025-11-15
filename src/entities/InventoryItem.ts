import { Item } from "@entities/Item";

export interface InventoryItem {
  charid?: number; // Character Identifier
  slotid?: number; // Slot Identifier
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
  locked?: boolean; // Locked: true = Do not auto-sell/discard
  itemDetails?: Item;
}
