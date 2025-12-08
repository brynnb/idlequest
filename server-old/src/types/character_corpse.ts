/**
 * Character Corpse Types
 * Based on the character_corpses table in the database
 */

import {
  CharacterClass,
  CharacterGender,
  CharacterRace,
  ZoneID,
} from "./index.js";

/**
 * Represents a character's corpse
 */
export interface CharacterCorpse {
  id: number;
  charid: number;
  charname: string;
  zone_id: ZoneID;
  x: number;
  y: number;
  z: number;
  heading: number;
  time_of_death: string; // datetime
  rez_time: number;
  is_rezzed: boolean;
  is_buried: boolean;
  was_at_graveyard: boolean;
  is_locked: boolean;
  exp: number;
  gmexp: number;
  size: number;
  level: number;
  race: CharacterRace;
  gender: CharacterGender;
  class: CharacterClass;
  deity: number;
  texture: number;
  helm_texture: number;
  copper: number;
  silver: number;
  gold: number;
  platinum: number;
  hair_color: number;
  beard_color: number;
  eye_color_1: number;
  eye_color_2: number;
  hair_style: number;
  face: number;
  beard: number;
  wc_1: number;
  wc_2: number;
  wc_3: number;
  wc_4: number;
  wc_5: number;
  wc_6: number;
  wc_7: number;
  wc_8: number;
  wc_9: number;
  killedby: number;
  rezzable: boolean;
}

/**
 * Represents a simplified view of a character's corpse
 */
export interface SimpleCorpse {
  id: number;
  character_id: number;
  character_name: string;
  zone_id: ZoneID;
  x: number;
  y: number;
  z: number;
  time_of_death: string;
  is_rezzed: boolean;
  is_buried: boolean;
  level: number;
  rezzable: boolean;
}

/**
 * Converts a CharacterCorpse to a SimpleCorpse
 */
export function toSimpleCorpse(corpse: CharacterCorpse): SimpleCorpse {
  return {
    id: corpse.id,
    character_id: corpse.charid,
    character_name: corpse.charname,
    zone_id: corpse.zone_id,
    x: corpse.x,
    y: corpse.y,
    z: corpse.z,
    time_of_death: corpse.time_of_death,
    is_rezzed: corpse.is_rezzed,
    is_buried: corpse.is_buried,
    level: corpse.level,
    rezzable: corpse.rezzable,
  };
}
