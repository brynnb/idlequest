/**
 * Types related to bug reports
 * Based on the bugs table in the database
 */

/**
 * Represents a bug report from the database
 */
export interface Bugs {
  id: number;
  zone: string;
  name: string;
  ui: string;
  x: number;
  y: number;
  z: number;
  type: string;
  flag: number;
  target: string | null;
  bug: string;
  date: string;
  status: number;
  _can_duplicate: number;
  _crash_bug: number;
  _target_info: number;
  _character_flags: number;
}

/**
 * Represents a simplified view of a bug report
 */
export interface SimpleBugReport {
  id: number;
  zone: string;
  playerName: string;
  ui: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  type: string;
  flag: number;
  target: string | null;
  description: string;
  date: string;
  status: number;
  canDuplicate: boolean;
  crashBug: boolean;
  targetInfo: boolean;
  characterFlags: boolean;
}

/**
 * Converts a Bugs object to a SimpleBugReport object
 */
export function toSimpleBugReport(bug: Bugs): SimpleBugReport {
  return {
    id: bug.id,
    zone: bug.zone,
    playerName: bug.name,
    ui: bug.ui,
    position: {
      x: bug.x,
      y: bug.y,
      z: bug.z,
    },
    type: bug.type,
    flag: bug.flag,
    target: bug.target,
    description: bug.bug,
    date: bug.date,
    status: bug.status,
    canDuplicate: bug._can_duplicate === 1,
    crashBug: bug._crash_bug === 1,
    targetInfo: bug._target_info === 1,
    characterFlags: bug._character_flags === 1,
  };
}
