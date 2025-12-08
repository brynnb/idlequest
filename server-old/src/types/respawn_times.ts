/**
 * Types related to respawn times
 * Based on the respawn_times table in the database
 */

/**
 * Represents a respawn time entry from the database
 */
export interface RespawnTimes {
  id: number;
  start: number;
  duration: number;
}

/**
 * Represents a simplified view of a respawn time entry
 */
export interface SimpleRespawnTime {
  id: number;
  startTime: number;
  duration: number;
}

/**
 * Converts a RespawnTimes object to a SimpleRespawnTime object
 */
export function toSimpleRespawnTime(
  respawnTime: RespawnTimes
): SimpleRespawnTime {
  return {
    id: respawnTime.id,
    startTime: respawnTime.start,
    duration: respawnTime.duration,
  };
}
