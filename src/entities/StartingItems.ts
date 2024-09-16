export interface StartingItems {
  id?: number; // Unique Starting Items Entry Identifier
  class_list?: string; // List of classes
  class?: number; // Class: 0 = All
  deityid?: number; // Deity: 0 = All
  zone_id_list?: string; // List of zone IDs
  itemid?: number; // Item Identifier
  item_charges?: number; // Item Charges
  status?: number; // Status
  slot?: number; // Slot
  min_expansion?: number; // Minimum Expansion
  max_expansion?: number; // Maximum Expansion
  content_flags?: string; // Content Flags Required to be Enabled
  content_flags_disabled?: string; // Content Flags Required to be Disabled
}
