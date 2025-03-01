/**
 * Types related to command logging
 * Based on the commands_log table in the database
 */

/**
 * Represents a command log entry from the database
 */
export interface CommandsLog {
  entry_id: number;
  char_name: string | null;
  acct_name: string | null;
  y: number;
  x: number;
  z: number;
  command: string | null;
  target_type: string | null;
  target: string | null;
  tar_y: number;
  tar_x: number;
  tar_z: number;
  zone_id: number | null;
  zone_name: string | null;
  time: string | null;
}

/**
 * Represents a simplified view of a command log entry
 */
export interface SimpleCommandLog {
  id: number;
  characterName: string | null;
  accountName: string | null;
  position: {
    x: number;
    y: number;
    z: number;
  };
  command: string | null;
  targetType: string | null;
  targetName: string | null;
  targetPosition: {
    x: number;
    y: number;
    z: number;
  };
  zoneId: number | null;
  zoneName: string | null;
  timestamp: string | null;
}

/**
 * Converts a CommandsLog object to a SimpleCommandLog object
 */
export function toSimpleCommandLog(log: CommandsLog): SimpleCommandLog {
  return {
    id: log.entry_id,
    characterName: log.char_name,
    accountName: log.acct_name,
    position: {
      x: log.x,
      y: log.y,
      z: log.z,
    },
    command: log.command,
    targetType: log.target_type,
    targetName: log.target,
    targetPosition: {
      x: log.tar_x,
      y: log.tar_y,
      z: log.tar_z,
    },
    zoneId: log.zone_id,
    zoneName: log.zone_name,
    timestamp: log.time,
  };
}
