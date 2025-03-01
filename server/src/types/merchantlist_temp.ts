/**
 * Types related to temporary merchant lists
 * Based on the merchantlist_temp table in the database
 */

/**
 * Represents a temporary merchant list entry
 */
export interface MerchantlistTemp {
  merchantid: number;
  slot: number;
  itemid: number;
  charges: number;
}

/**
 * Represents a simplified view of a temporary merchant list entry
 */
export interface SimpleMerchantItem {
  merchantId: number;
  slot: number;
  itemId: number;
  charges: number;
}

/**
 * Converts a MerchantlistTemp to a SimpleMerchantItem
 */
export function toSimpleMerchantItem(
  item: MerchantlistTemp
): SimpleMerchantItem {
  return {
    merchantId: item.merchantid,
    slot: item.slot,
    itemId: item.itemid,
    charges: item.charges,
  };
}
