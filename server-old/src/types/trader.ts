/**
 * Types related to trader system
 * Based on the trader table in the database
 */

/**
 * Represents a trader item from the database
 */
export interface Trader {
  char_id: number;
  item_id: number;
  i_slotid: number;
  charges: number;
  item_cost: number;
  slot_id: number;
}

/**
 * Represents a simplified view of a trader item
 */
export interface SimpleTraderItem {
  characterId: number;
  itemId: number;
  inventorySlotId: number;
  charges: number;
  price: number;
  traderSlotId: number;
}

/**
 * Converts a Trader object to a SimpleTraderItem object
 */
export function toSimpleTraderItem(traderItem: Trader): SimpleTraderItem {
  return {
    characterId: traderItem.char_id,
    itemId: traderItem.item_id,
    inventorySlotId: traderItem.i_slotid,
    charges: traderItem.charges,
    price: traderItem.item_cost,
    traderSlotId: traderItem.slot_id,
  };
}
