/**
 * Types related to player title sets
 * Based on the player_titlesets table in the database
 */

/**
 * Represents a player title set from the database
 */
export interface PlayerTitlesets {
  id: number;
  char_id: number;
  title_set: number;
}

/**
 * Represents a simplified view of a player title set
 */
export interface SimpleTitleSet {
  id: number;
  characterId: number;
  titleSetId: number;
}

/**
 * Converts a PlayerTitlesets object to a SimpleTitleSet object
 */
export function toSimpleTitleSet(titleSet: PlayerTitlesets): SimpleTitleSet {
  return {
    id: titleSet.id,
    characterId: titleSet.char_id,
    titleSetId: titleSet.title_set,
  };
}
