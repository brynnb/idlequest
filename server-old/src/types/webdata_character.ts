/**
 * Types related to web interface character data
 * Based on the webdata_character table in the database
 */

/**
 * Represents a web character data entry from the database
 */
export interface WebdataCharacter {
  id: number;
  name: string | null;
  last_login: number | null;
  last_seen: number | null;
}

/**
 * Represents a simplified view of a web character data entry
 */
export interface SimpleWebCharacter {
  id: number;
  name: string | null;
  lastLogin: number | null;
  lastSeen: number | null;
}

/**
 * Converts a WebdataCharacter object to a SimpleWebCharacter object
 */
export function toSimpleWebCharacter(
  character: WebdataCharacter
): SimpleWebCharacter {
  return {
    id: character.id,
    name: character.name,
    lastLogin: character.last_login,
    lastSeen: character.last_seen,
  };
}
