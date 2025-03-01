/**
 * Character Bind Types
 * Based on the character_bind table in the database
 */

import { ZoneID } from "./index.js";

/**
 * Represents a character's bind point
 */
export interface CharacterBind {
  id: number;
  is_home: boolean;
  zone_id: ZoneID;
  x: number;
  y: number;
  z: number;
  heading: number;
}

/**
 * Represents a character's location in the world
 */
export interface CharacterLocation {
  zone_id: ZoneID;
  x: number;
  y: number;
  z: number;
  heading: number;
}

/**
 * Enum for bind types
 */
export enum BindType {
  HOME = 0,
  SECONDARY = 1,
}

/**
 * Converts a CharacterBind to a CharacterLocation
 */
export function bindToLocation(bind: CharacterBind): CharacterLocation {
  return {
    zone_id: bind.zone_id,
    x: bind.x,
    y: bind.y,
    z: bind.z,
    heading: bind.heading,
  };
}
