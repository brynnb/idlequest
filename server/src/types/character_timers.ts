/**
 * Types related to character timers
 * Based on the character_timers table in the database
 */

/**
 * Represents a character timer from the database
 */
export interface CharacterTimers {
  id: number;
  type: number;
  start: number;
  duration: number;
  enable: number;
}

/**
 * Represents a simplified view of a character timer
 */
export interface SimpleTimer {
  characterId: number;
  timerType: number;
  startTime: number;
  duration: number;
  isEnabled: boolean;
}

/**
 * Converts a CharacterTimers object to a SimpleTimer object
 */
export function toSimpleTimer(timer: CharacterTimers): SimpleTimer {
  return {
    characterId: timer.id,
    timerType: timer.type,
    startTime: timer.start,
    duration: timer.duration,
    isEnabled: timer.enable === 1,
  };
}
