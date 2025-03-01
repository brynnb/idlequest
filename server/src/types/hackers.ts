/**
 * Types related to hacker tracking
 * Based on the hackers table in the database
 */

/**
 * Represents a hacker entry from the database
 */
export interface Hackers {
  id: number;
  account: string;
  name: string;
  hacked: string;
  zone: string | null;
  date: string;
}

/**
 * Represents a simplified view of a hacker entry
 */
export interface SimpleHacker {
  id: number;
  accountName: string;
  characterName: string;
  hackedDescription: string;
  zone: string | null;
  timestamp: string;
}

/**
 * Converts a Hackers object to a SimpleHacker object
 */
export function toSimpleHacker(hacker: Hackers): SimpleHacker {
  return {
    id: hacker.id,
    accountName: hacker.account,
    characterName: hacker.name,
    hackedDescription: hacker.hacked,
    zone: hacker.zone,
    timestamp: hacker.date,
  };
}
