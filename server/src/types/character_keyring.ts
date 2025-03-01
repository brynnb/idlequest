/**
 * Types related to character keyring
 * Based on the character_keyring table in the database
 */

/**
 * Represents a character keyring item from the database
 */
export interface CharacterKeyring {
  id: number;
  char_id: number;
  item_id: number;
}

/**
 * Represents a simplified view of a character keyring item
 */
export interface SimpleKeyringItem {
  characterId: number;
  itemId: number;
}

/**
 * Converts a CharacterKeyring object to a SimpleKeyringItem object
 */
export function toSimpleKeyringItem(
  keyring: CharacterKeyring
): SimpleKeyringItem {
  return {
    characterId: keyring.char_id,
    itemId: keyring.item_id,
  };
}
