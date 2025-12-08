/**
 * Types related to character lookup
 * Based on the character_lookup table in the database
 */

/**
 * Represents a character lookup entry
 */
export interface CharacterLookup {
  id: number;
  account_id: number;
  name: string;
  guild_id: number;
  level: number;
  class: number;
  race: number;
  zone: number;
  last_login: number;
  time_played: number;
}

/**
 * Represents a simplified view of a character lookup entry
 */
export interface SimpleCharacterLookup {
  id: number;
  accountId: number;
  name: string;
  guildId: number;
  level: number;
  class: number;
  race: number;
  zone: number;
  lastLogin: Date;
  timePlayed: number;
}

/**
 * Converts a CharacterLookup to a SimpleCharacterLookup
 */
export function toSimpleCharacterLookup(
  lookup: CharacterLookup
): SimpleCharacterLookup {
  return {
    id: lookup.id,
    accountId: lookup.account_id,
    name: lookup.name,
    guildId: lookup.guild_id,
    level: lookup.level,
    class: lookup.class,
    race: lookup.race,
    zone: lookup.zone,
    lastLogin: new Date(lookup.last_login * 1000),
    timePlayed: lookup.time_played,
  };
}
