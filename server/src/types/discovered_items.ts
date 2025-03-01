/**
 * Types related to discovered items
 * Based on the discovered_items table in the database
 */

/**
 * Represents a discovered item entry from the database
 */
export interface DiscoveredItems {
  item_id: number;
  char_name: string;
  discovered_date: number;
  account_status: number;
}

/**
 * Represents a simplified view of a discovered item entry
 */
export interface SimpleDiscoveredItem {
  itemId: number;
  characterName: string;
  discoveredDate: number;
  accountStatus: number;
}

/**
 * Converts a DiscoveredItems object to a SimpleDiscoveredItem object
 */
export function toSimpleDiscoveredItem(
  item: DiscoveredItems
): SimpleDiscoveredItem {
  return {
    itemId: item.item_id,
    characterName: item.char_name,
    discoveredDate: item.discovered_date,
    accountStatus: item.account_status,
  };
}
