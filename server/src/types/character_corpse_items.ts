/**
 * Types related to character corpse items
 * Based on the character_corpse_items table in the database
 */

/**
 * Represents an item in a character's corpse
 */
export interface CharacterCorpseItem {
  corpse_id: number;
  equip_slot: number;
  item_id: number;
  charges: number;
  aug_1: number;
  aug_2: number;
  aug_3: number;
  aug_4: number;
  aug_5: number;
  aug_6: number;
  attuned: number;
  custom_data: string;
}

/**
 * Represents a simplified view of an item in a character's corpse
 */
export interface SimpleCorpseItem {
  corpseId: number;
  equipSlot: number;
  itemId: number;
  charges: number;
  augments: number[];
  isAttuned: boolean;
  customData: string;
}

/**
 * Converts a CharacterCorpseItem to a SimpleCorpseItem
 */
export function toSimpleCorpseItem(
  item: CharacterCorpseItem
): SimpleCorpseItem {
  return {
    corpseId: item.corpse_id,
    equipSlot: item.equip_slot,
    itemId: item.item_id,
    charges: item.charges,
    augments: [
      item.aug_1,
      item.aug_2,
      item.aug_3,
      item.aug_4,
      item.aug_5,
      item.aug_6,
    ].filter((aug) => aug !== 0),
    isAttuned: item.attuned === 1,
    customData: item.custom_data,
  };
}
