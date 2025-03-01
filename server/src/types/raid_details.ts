/**
 * Types related to raid details
 * Based on the raid_details table in the database
 */

/**
 * Represents raid details from the database
 */
export interface RaidDetails {
  raidid: number;
  loottype: number;
  locked: number;
}

/**
 * Represents a simplified view of raid details
 */
export interface SimpleRaidDetails {
  raidId: number;
  lootType: number;
  isLocked: boolean;
}

/**
 * Converts a RaidDetails object to a SimpleRaidDetails object
 */
export function toSimpleRaidDetails(details: RaidDetails): SimpleRaidDetails {
  return {
    raidId: details.raidid,
    lootType: details.loottype,
    isLocked: details.locked === 1,
  };
}
